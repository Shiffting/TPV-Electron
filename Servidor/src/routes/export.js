import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authMiddleware } from '../lib/auth.js';
import {requireRole} from '../lib/requireRole.js'

const r = Router();
r.use(authMiddleware, requireRole('admin','caja'));

function csv(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = v => (v==null? '' : String(v).replace(/"/g,'""'));
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => `"${escape(row[h])}"`).join(','));
  }
  return lines.join('\r\n');
}

// CSV ventas por método en un rango
r.get('/ventas-por-metodo.csv', async (req, res) => {
  const from = req.query.from ? req.query.from+' 00:00:00' : '1970-01-01 00:00:00';
  const to   = req.query.to   ? req.query.to  +' 23:59:59' : '2999-12-31 23:59:59';

  const [rows] = await pool.query(
    `SELECT mp.codigo AS metodo, mp.nombre, SUM(pg.importe) AS total, COUNT(*) AS pagos
     FROM pagos pg
     JOIN metodos_pago mp ON mp.id=pg.metodo_id
     WHERE pg.creado_en BETWEEN ? AND ?
     GROUP BY mp.id, mp.codigo, mp.nombre
     ORDER BY total DESC`,
     [from, to]
  );

  const out = csv(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ventas-por-metodo.csv"');
  res.send(out);
});

// CSV top productos en un rango
r.get('/top-productos.csv', async (req, res) => {
  const from = req.query.from ? req.query.from+' 00:00:00' : '1970-01-01 00:00:00';
  const to   = req.query.to   ? req.query.to  +' 23:59:59' : '2999-12-31 23:59:59';

  const [rows] = await pool.query(
    `SELECT l.producto_id, l.nombre_producto,
            SUM(l.cantidad) AS uds, SUM(l.total_linea) AS total
     FROM ticket_lineas l
     JOIN tickets t ON t.id=l.ticket_id
     WHERE l.estado='pagado' AND t.cerrado_en BETWEEN ? AND ?
     GROUP BY l.producto_id, l.nombre_producto
     ORDER BY total DESC
     LIMIT 200`,
     [from, to]
  );

  const out = csv(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="top-productos.csv"');
  res.send(out);
});

export default r;
