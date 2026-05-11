import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authMiddleware } from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import {requireRole} from '../lib/requireRole.js'

const r = Router();
r.use(authMiddleware, requireRole('admin','caja')); // solo admin/caja

// Abrir sesión de caja
r.post('/abrir', async (req, res) => {
  const { efectivoInicial = 0, observaciones = null } = req.body || {};
  const uid = req.user?.uid;

  // Evitar doble apertura
  const [[abierta]] = await pool.query(`SELECT id FROM caja_sesiones WHERE estado='abierta' ORDER BY id DESC LIMIT 1`);
  if (abierta) return res.status(400).json({ error: 'Ya existe una sesión de caja abierta' });

  const [ins] = await pool.execute(
    `INSERT INTO caja_sesiones (usuario_apertura, efectivo_inicial, observaciones) VALUES (?,?,?)`,
    [uid, efectivoInicial, observaciones]
  );
  await audit({ usuarioId: uid, accion: 'CAJA_ABRIR', detalle: { sesionId: ins.insertId, efectivoInicial }});
  res.json({ sesionId: ins.insertId });
});

// Añadir movimiento manual (entrada/salida)
r.post('/movimiento', async (req, res) => {
  const { tipo, concepto, importe } = req.body || {};
  const uid = req.user?.uid;

  if (!tipo || !['entrada','salida'].includes(tipo)) return res.status(400).json({ error: 'tipo inválido' });
  if (!concepto || !importe) return res.status(400).json({ error: 'concepto/importe requeridos' });

  const [[sesion]] = await pool.query(`SELECT id FROM caja_sesiones WHERE estado='abierta' ORDER BY id DESC LIMIT 1`);
  if (!sesion) return res.status(400).json({ error: 'No hay sesión abierta' });

  const [ins] = await pool.execute(
    `INSERT INTO caja_movimientos (sesion_id, tipo, concepto, importe, usuario_id) VALUES (?,?,?,?,?)`,
    [sesion.id, tipo, concepto, importe, uid || null]
  );
  await audit({ usuarioId: uid, accion: 'CAJA_MOV', detalle: { sesionId: sesion.id, tipo, concepto, importe }});
  res.json({ id: ins.insertId });
});

// Resumen en vivo de la sesión abierta
r.get('/abierta', async (_req, res) => {
  const [[s]] = await pool.query(`SELECT * FROM caja_sesiones WHERE estado='abierta' ORDER BY id DESC LIMIT 1`);
  if (!s) return res.status(404).json({ error: 'Sin sesión abierta' });

  // Sumar pagos en efectivo durante la sesión
  const [ef] = await pool.query(
    `SELECT COALESCE(SUM(pg.importe),0) AS efectivo_ventas
     FROM pagos pg
     JOIN metodos_pago mp ON mp.id = pg.metodo_id AND mp.codigo='efectivo'
     WHERE pg.creado_en BETWEEN ? AND NOW()`,
    [s.abierto_en]
  );

  // Movimientos manuales
  const [movs] = await pool.query(
    `SELECT tipo, concepto, importe, creado_en FROM caja_movimientos WHERE sesion_id=? ORDER BY id`,
    [s.id]
  );
  const totalEntradas = movs.filter(m=>m.tipo==='entrada').reduce((a,b)=>a+Number(b.importe),0);
  const totalSalidas  = movs.filter(m=>m.tipo==='salida' ).reduce((a,b)=>a+Number(b.importe),0);

  const esperado = Number(s.efectivo_inicial) + Number(ef[0].efectivo_ventas) + totalEntradas - totalSalidas;

  res.json({
    sesion: s,
    efectivoVentas: +ef[0].efectivo_ventas,
    movimientos: movs,
    totalEntradas,
    totalSalidas,
    esperado
  });
});

// Cerrar sesión de caja (con conteo físico)
r.post('/cerrar', async (req, res) => {
  const { efectivoContado = null, observaciones = null } = req.body || {};
  const uid = req.user?.uid;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[s]] = await conn.query(`SELECT * FROM caja_sesiones WHERE estado='abierta' ORDER BY id DESC LIMIT 1 FOR UPDATE`);
    if (!s) throw new Error('Sin sesión abierta');

    // ventas efectivo dentro del rango [abierto_en, ahora]
    const [[ef]] = await conn.query(
      `SELECT COALESCE(SUM(pg.importe),0) AS efectivo_ventas
       FROM pagos pg
       JOIN metodos_pago mp ON mp.id=pg.metodo_id AND mp.codigo='efectivo'
       WHERE pg.creado_en BETWEEN ? AND NOW()`,
      [s.abierto_en]
    );
    const [movs] = await conn.query(`SELECT tipo, importe FROM caja_movimientos WHERE sesion_id=?`, [s.id]);

    const totalEntradas = movs.filter(m=>m.tipo==='entrada').reduce((a,b)=>a+Number(b.importe),0);
    const totalSalidas  = movs.filter(m=>m.tipo==='salida' ).reduce((a,b)=>a+Number(b.importe),0);
    const esperado = Number(s.efectivo_inicial) + Number(ef.efectivo_ventas) + totalEntradas - totalSalidas;

    await conn.execute(
      `UPDATE caja_sesiones
       SET estado='cerrada', usuario_cierre=?, cerrado_en=NOW(),
           efectivo_contado=?, observaciones=COALESCE(?, observaciones)
       WHERE id=?`,
      [uid || null, efectivoContado, observaciones, s.id]
    );

    await conn.commit();
    await audit({
      usuarioId: uid,
      accion: 'CAJA_CERRAR',
      detalle: { sesionId: s.id, esperado, contado: efectivoContado, descuadre: efectivoContado==null? null : +(efectivoContado - esperado).toFixed(2) }
    });

    res.json({
      ok: true,
      sesionId: s.id,
      esperado,
      contado: efectivoContado,
      descuadre: efectivoContado==null? null : +(efectivoContado - esperado).toFixed(2)
    });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally {
    conn.release();
  }
});

export default r;
