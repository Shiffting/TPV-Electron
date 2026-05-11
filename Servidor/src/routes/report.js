import { Router } from "express";
import { pool } from "../db/pool.js";
import { authMiddleware } from "../lib/auth.js";
import { rangeFromQuery } from "../lib/dates.js";
import {requireRole} from '../lib/requireRole.js'

const r = Router();
r.use(authMiddleware, requireRole("admin", "caja")); // sólo admin/caja

// Resumen general: ventas, tickets, ticket medio, por método de pago
r.get("/summary", async (req, res) => {
  const { from, to } = rangeFromQuery(req.query);

  const [[tot]] = await pool.query(
    `SELECT
       COALESCE(SUM(pg.importe),0) AS ventas,
       COUNT(DISTINCT t.id) AS tickets
     FROM pagos pg
     JOIN tickets t ON t.id=pg.ticket_id
     WHERE pg.creado_en BETWEEN ? AND ?`,
    [from, to],
  );

  const [[avg]] = await pool.query(
    `SELECT COALESCE(AVG(x.total),0) AS ticket_medio
     FROM (
       SELECT t.id, COALESCE(SUM(pg.importe),0) AS total
       FROM tickets t
       LEFT JOIN pagos pg ON pg.ticket_id=t.id AND pg.creado_en BETWEEN ? AND ?
       WHERE t.cerrado_en BETWEEN ? AND ?
       GROUP BY t.id
     ) x`,
    [from, to, from, to],
  );

  const [porMetodo] = await pool.query(
    `SELECT mp.codigo, mp.nombre, COALESCE(SUM(pg.importe),0) AS total
     FROM metodos_pago mp
     LEFT JOIN pagos pg ON pg.metodo_id=mp.id AND pg.creado_en BETWEEN ? AND ?
     GROUP BY mp.id
     ORDER BY total DESC`,
    [from, to],
  );

  res.json({
    rango: { from, to },
    ventas: +tot.ventas,
    tickets: +tot.tickets,
    ticketMedio: +avg.ticket_medio,
    porMetodo,
  });
});

// Ventas por hora
r.get("/by-hour", async (req, res) => {
  const { from, to } = rangeFromQuery(req.query);
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(pg.creado_en,'%Y-%m-%d %H:00:00') AS hora,
            SUM(pg.importe) AS total
     FROM pagos pg
     WHERE pg.creado_en BETWEEN ? AND ?
     GROUP BY DATE_FORMAT(pg.creado_en,'%Y-%m-%d %H')
     ORDER BY hora`,
    [from, to],
  );
  res.json(rows);
});

// Top productos
r.get("/top-products", async (req, res) => {
  const { from, to } = rangeFromQuery(req.query);
  const [rows] = await pool.query(
    `SELECT l.producto_id, l.nombre_producto,
            SUM(l.cantidad) AS uds,
            SUM(l.total_linea) AS total
     FROM ticket_lineas l
     JOIN tickets t ON t.id=l.ticket_id
     WHERE l.estado IN ('pagado') AND t.cerrado_en BETWEEN ? AND ?
     GROUP BY l.producto_id, l.nombre_producto
     ORDER BY total DESC
     LIMIT 20`,
    [from, to],
  );
  res.json(rows);
});

// Ventas por categoría
r.get("/by-category", async (req, res) => {
  const { from, to } = rangeFromQuery(req.query);
  const [rows] = await pool.query(
    `SELECT c.id, c.nombre AS categoria,
            SUM(l.total_linea) AS total
     FROM ticket_lineas l
     JOIN tickets t ON t.id=l.ticket_id
     LEFT JOIN productos p ON p.id=l.producto_id
     LEFT JOIN categorias c ON c.id=p.categoria_id
     WHERE l.estado='pagado' AND t.cerrado_en BETWEEN ? AND ?
     GROUP BY c.id, c.nombre
     ORDER BY total DESC`,
    [from, to],
  );
  res.json(rows);
});

r.get("/kpis", async (req, res) => {
  // usamos fecha local del servidor; si necesitas TZ exacta podemos pasar from/to
  const [[hoy]] = await pool.query(
    `SELECT DATE(NOW()) AS d, DATE_SUB(DATE(NOW()), INTERVAL 1 DAY) AS ayer`,
  );
  const dHoy = hoy.d; // YYYY-MM-DD
  const dAyer = hoy.ayer;

  // ventas y tickets de HOY
  const [[vHoy]] = await pool.query(
    `SELECT
       COALESCE(SUM(pg.importe),0) AS ventas,
       COUNT(DISTINCT t.id) AS tickets
     FROM pagos pg
     JOIN tickets t ON t.id=pg.ticket_id
     WHERE DATE(pg.creado_en)=?`,
    [dHoy],
  );

  // ventas y tickets de AYER
  const [[vAyer]] = await pool.query(
    `SELECT
       COALESCE(SUM(pg.importe),0) AS ventas,
       COUNT(DISTINCT t.id) AS tickets
     FROM pagos pg
     JOIN tickets t ON t.id=pg.ticket_id
     WHERE DATE(pg.creado_en)=?`,
    [dAyer],
  );

  // ticket medio HOY (con tickets cerrados hoy)
  const [[tmHoy]] = await pool.query(
    `SELECT COALESCE(AVG(x.total),0) AS ticket_medio
     FROM (
       SELECT t.id, COALESCE(SUM(pg.importe),0) AS total
       FROM tickets t
       LEFT JOIN pagos pg ON pg.ticket_id=t.id
       WHERE DATE(t.cerrado_en)=?
       GROUP BY t.id
     ) x`,
    [dHoy],
  );

  // ventas últimos 7 días (por fecha)
  const [ventas7d] = await pool.query(
    `SELECT DATE(pg.creado_en) AS fecha, SUM(pg.importe) AS total
     FROM pagos pg
     WHERE pg.creado_en >= DATE_SUB(DATE(NOW()), INTERVAL 6 DAY)
     GROUP BY DATE(pg.creado_en)
     ORDER BY fecha`,
  );

  // top productos últimos 7 días
  const [topProductos] = await pool.query(
    `SELECT l.producto_id, l.nombre_producto,
            SUM(l.cantidad) AS uds, SUM(l.total_linea) AS total
     FROM ticket_lineas l
     JOIN tickets t ON t.id=l.ticket_id
     WHERE l.estado='pagado'
       AND t.cerrado_en >= DATE_SUB(DATE(NOW()), INTERVAL 6 DAY)
     GROUP BY l.producto_id, l.nombre_producto
     ORDER BY total DESC
     LIMIT 10`,
  );

  const topProductosNormalizados = topProductos.map((p) => ({
    productoId: p.producto_id,
    nombreProducto: p.nombre_producto,
    uds: Number(p.uds),
    total: Number(p.total),
  }));

  res.json({
    hoy: {
      ventas: +vHoy.ventas,
      tickets: +vHoy.tickets,
      ticketMedio: +tmHoy.ticket_medio,
    },

    ayer: {
      ventas: +vAyer.ventas,
      tickets: +vAyer.tickets,
    },

    ventas7d: ventas7d.map((v) => ({
      fecha: v.fecha,
      total: Number(v.total),
    })),

    topProductos: topProductosNormalizados,
  });
});

export default r;
