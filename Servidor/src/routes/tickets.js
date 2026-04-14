import { Router } from 'express';
import { pool } from '../db/pool.js';
import { CrearTicketSchema, AddLineaSchema, PagarParcialSchema } from '../lib/validators.js';
import { audit } from '../lib/audit.js';

const r = Router();



// Crear ticket (opcionalmente ligado a mesa)
r.post('/', async (req, res) => {
    const parse = CrearTicketSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.issues);
    const { mesaId = null } = parse.data;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [ins] = await conn.execute(
            'INSERT INTO tickets (mesa_id, estado) VALUES (?, "abierto")',
            [mesaId]
        );
        const ticketId = ins.insertId;
        if (mesaId) {
            await conn.execute('UPDATE mesas SET estado="ocupada" WHERE id=?', [mesaId]);
        }
        await conn.commit();
        await audit({ usuarioId: req.user?.uid || null, accion: 'CREAR_TICKET', detalle: { ticketId, mesaId } });
        res.json({ ticketId });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

// Añadir línea (con propiedades, incluido texto libre)
r.post('/:ticketId/lineas', async (req, res) => {
    const parse = AddLineaSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.issues);
    const { productoId, nombreProducto, cantidad, pvp, propiedades } = parse.data;
    const ticketId = Number(req.params.ticketId);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const totalLinea = +(cantidad * pvp).toFixed(2);
        const [ins] = await conn.execute(
            `INSERT INTO ticket_lineas (ticket_id, producto_id, nombre_producto, cantidad, pvp, total_linea)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [ticketId, productoId ?? null, nombreProducto, cantidad, pvp, totalLinea]
        );
        const lineaId = ins.insertId;

        let delta = 0;
        for (const prop of propiedades) {
            const precioDelta = prop.precioDelta ?? 0;
            delta += precioDelta;
            await conn.execute(
                `INSERT INTO ticket_linea_propiedades (ticket_linea_id, propiedad_id, texto_libre, precio_delta)
         VALUES (?, ?, ?, ?)`,
                [lineaId, prop.propiedadId ?? null, prop.texto ?? null, precioDelta]
            );
        }

        if (delta !== 0) {
            await conn.execute(
                'UPDATE ticket_lineas SET total_linea = total_linea + ? WHERE id = ?',
                [delta, lineaId]
            );
        }

        // Actualizar totales rápidos e items_pendientes de la mesa (si existe)
        await conn.execute(
            `UPDATE tickets t
       JOIN (SELECT ticket_id, SUM(total_linea) AS suma FROM ticket_lineas WHERE ticket_id=? AND estado='pendiente') x
       ON x.ticket_id=t.id
       SET t.total_bruto = x.suma, t.total_neto = x.suma
       WHERE t.id=?`,
            [ticketId, ticketId]
        );

        const [[tk]] = await conn.query('SELECT mesa_id FROM tickets WHERE id=?', [ticketId]);
        if (tk?.mesa_id) {
            await conn.execute(
                `UPDATE mesas m
         JOIN (SELECT ticket_id, COUNT(*) c FROM ticket_lineas WHERE ticket_id=? AND estado='pendiente') y
         ON y.ticket_id=?
         SET m.items_pendientes = y.c, m.estado='ocupada'
         WHERE m.id = ?`,
                [ticketId, ticketId, tk.mesa_id]
            );
        }

        await conn.commit();
        await audit({
            usuarioId: req.user?.uid || null,
            accion: 'ADD_LINEA',
            detalle: { ticketId, lineaId, nombreProducto, cantidad, pvp, delta }
        });
        res.json({ lineaId });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

// Pagar parcialmente (dividir cuenta por líneas)
r.post('/:ticketId/pagar-parcial', async (req, res) => {
    const parse = PagarParcialSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.issues);
    const { lineasIds, metodoCodigo, importe } = parse.data;
    const ticketId = Number(req.params.ticketId);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Método de pago
        const [[metodo]] = await conn.query('SELECT id FROM metodos_pago WHERE codigo=? AND activo=1', [metodoCodigo]);
        if (!metodo) throw new Error('Método de pago inválido');

        // Marcar líneas pagadas
        const [upd] = await conn.query(
            `UPDATE ticket_lineas SET estado='pagado'
       WHERE ticket_id=? AND id IN (${lineasIds.map(() => '?').join(',')})`,
            [ticketId, ...lineasIds]
        );

        // Registrar pago
        await conn.execute('INSERT INTO pagos (ticket_id, metodo_id, importe) VALUES (?, ?, ?)', [ticketId, metodo.id, importe]);

        // Recalcular totales y estado del ticket
        const [[pend]] = await conn.query(
            `SELECT COALESCE(SUM(total_linea),0) AS pendiente
       FROM ticket_lineas WHERE ticket_id=? AND estado='pendiente'`,
            [ticketId]
        );
        const [[pag]] = await conn.query(
            `SELECT COALESCE(SUM(total_linea),0) AS pagado
       FROM ticket_lineas WHERE ticket_id=? AND estado='pagado'`,
            [ticketId]
        );
        const total = Number(pend.pendiente) + Number(pag.pagado);

        await conn.execute(
            'UPDATE tickets SET total_bruto=?, total_neto=?, estado=? WHERE id=?',
            [total, total, Number(pend.pendiente) === 0 ? 'cerrado' : 'parcial', ticketId]
        );

        // Actualizar mesa si aplica
        const [[tk]] = await conn.query('SELECT mesa_id FROM tickets WHERE id=?', [ticketId]);
        if (tk?.mesa_id) {
            await conn.execute(
                `UPDATE mesas SET items_pendientes=?, estado=?
         WHERE id=?`,
                [Number(pend.pendiente) === 0 ? 0 : upd.affectedRows, Number(pend.pendiente) === 0 ? 'libre' : 'ocupada', tk.mesa_id]
            );
        }

        await conn.commit();
        await audit({
            usuarioId: req.user?.uid || null,
            accion: 'PAGAR_PARCIAL',
            detalle: { ticketId, lineasIds, metodoCodigo, importe }
        });
        res.json({ ok: true, lineasActualizadas: upd.affectedRows, pendiente: Number(pend.pendiente) });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

// Cerrar ticket (todo)
r.post('/:ticketId/cerrar', async (req, res) => {
    const ticketId = Number(req.params.ticketId);
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();


        //Cerramos el ticket
        await conn.execute(`UPDATE ticket_lineas SET estado='pagado' WHERE ticket_id=? AND estado='pendiente'`, [ticketId]);
        await conn.execute(`UPDATE tickets SET estado='cerrado', cerrado_en=NOW() WHERE id=?`, [ticketId]);

        //Cogemos la mesa y la dejamos libre
        const [[tk]] = await conn.query('SELECT mesa_id FROM tickets WHERE id=?', [ticketId]);
        if (tk?.mesa_id) {
            await conn.execute(`UPDATE mesas SET estado='libre', items_pendientes=0 WHERE id=?`, [tk.mesa_id]);
        }
        await conn.commit();
        await audit({
            usuarioId: req.user?.uid || null,
            accion: 'CERRAR_TICKET',
            detalle: { ticketId }
        });
        res.json({ ok: true });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

// Obtener ticket completo (cabecera + lineas + propiedades + pagos)
r.get('/:ticketId', async (req, res) => {
    const ticketId = Number(req.params.ticketId);
    const [[tk]] = await pool.query('SELECT * FROM tickets WHERE id=?', [ticketId]);
    if (!tk) return res.status(404).json({ error: 'Ticket no encontrado' });

    const [lineas] = await pool.query(
        `SELECT * FROM ticket_lineas WHERE ticket_id=? ORDER BY id`, [ticketId]
    );
    const [props] = await pool.query(
        `SELECT lp.*, p.nombre AS propiedad_nombre
     FROM ticket_linea_propiedades lp
     LEFT JOIN propiedades p ON p.id = lp.propiedad_id
     WHERE lp.ticket_linea_id IN (
       SELECT id FROM ticket_lineas WHERE ticket_id=?
     )
     ORDER BY lp.id`, [ticketId]
    );
    const [pagos] = await pool.query(
        `SELECT pg.*, mp.codigo, mp.nombre AS metodo_nombre
     FROM pagos pg
     JOIN metodos_pago mp ON mp.id = pg.metodo_id
     WHERE pg.ticket_id=?
     ORDER BY pg.id`, [ticketId]
    );

    // agrupar props por línea
    const propsByLinea = props.reduce((acc, p) => {
        (acc[p.ticket_linea_id] ||= []).push(p);
        return acc;
    }, {});
    const lineasConProps = lineas.map(l => ({ ...l, propiedades: propsByLinea[l.id] || [] }));

    res.json({ ticket: tk, lineas: lineasConProps, pagos });
});

// Añadir propiedad de texto (o predefinida) a una línea existente
r.post('/lineas/:lineaId/propiedades', async (req, res) => {
    const lineaId = Number(req.params.lineaId);
    const { propiedadId = null, texto = null, precioDelta = 0 } = req.body || {};

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Insertar propiedad
        const [ins] = await conn.execute(
            `INSERT INTO ticket_linea_propiedades (ticket_linea_id, propiedad_id, texto_libre, precio_delta)
       VALUES (?, ?, ?, ?)`,
            [lineaId, propiedadId, texto, precioDelta]
        );

        // Recalcular total de la línea
        if (precioDelta !== 0) {
            await conn.execute(
                'UPDATE ticket_lineas SET total_linea = total_linea + ? WHERE id = ?',
                [precioDelta, lineaId]
            );
            // Actualizar totales del ticket
            const [[tl]] = await conn.query(
                'SELECT ticket_id FROM ticket_lineas WHERE id=?', [lineaId]
            );
            if (tl?.ticket_id) {
                await conn.execute(
                    `UPDATE tickets t
           JOIN (SELECT ticket_id, SUM(total_linea) AS suma
                 FROM ticket_lineas WHERE ticket_id=? AND estado='pendiente') x
           ON x.ticket_id=t.id
           SET t.total_bruto = COALESCE(x.suma,0), t.total_neto = COALESCE(x.suma,0)
           WHERE t.id=?`,
                    [tl.ticket_id, tl.ticket_id]
                );
            }
        }

        await conn.commit();
        res.json({ ok: true, propiedadId: ins.insertId });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

export default r;
