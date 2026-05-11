import { Router } from "express";
import { pool } from "../db/pool.js";
import { io } from "../app.js";

const r = Router();

/* =========================================
   LÍNEAS ACTIVAS COCINA
========================================= */

r.get("/", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      tl.id,
      tl.ticket_id,
      tl.nombre_producto,
      tl.cantidad,
      tl.estado_operativo,
      tl.created_at,

      t.mesa_id,

      p.estacion_id,

      e.nombre AS estacion_nombre,
      e.color AS estacion_color

    FROM ticket_lineas tl

    JOIN tickets t
      ON t.id = tl.ticket_id

    JOIN productos p
      ON p.id = tl.producto_id

    LEFT JOIN estaciones e
      ON e.id = p.estacion_id

    WHERE
      tl.estado = 'pendiente'

    ORDER BY
      tl.created_at ASC
  `);

  // =====================================
  // PROPIEDADES
  // =====================================

  const lineasIds = rows.map((r) => r.id);

  let props = [];

  if (lineasIds.length > 0) {
    const [pr] = await pool.query(
      `
      SELECT
        lp.ticket_linea_id,

        p.nombre

      FROM ticket_linea_propiedades lp

      JOIN propiedades p
        ON p.id = lp.propiedad_id

      WHERE lp.ticket_linea_id IN (${lineasIds.map(() => "?").join(",")})
      `,
      lineasIds,
    );

    props = pr;
  }

  // =====================================
  // AGRUPAR PROPS
  // =====================================

  const propsByLinea = {};

  for (const p of props) {
    if (!propsByLinea[p.ticket_linea_id]) {
      propsByLinea[p.ticket_linea_id] = [];
    }

    propsByLinea[p.ticket_linea_id].push(p.nombre);
  }

  // =====================================
  // RESPUESTA FINAL
  // =====================================

  const final = rows.map((l) => ({
    id: l.id,
    ticketId: l.ticket_id,
    nombreProducto: l.nombre_producto,
    cantidad: l.cantidad,
    estadoOperativo: l.estado_operativo,
    mesaId: l.mesa_id,
    estacionId: l.estacion_id,
    estacionNombre: l.estacion_nombre || "General",
    estacionColor: l.estacion_color || "#6366f1",
    propiedades: propsByLinea[l.id] || [],
  }));

  const [estaciones] = await pool.query(`
  SELECT
    id,
    nombre,
    color
  FROM estaciones
  ORDER BY orden ASC, id ASC
`);

  const grouped = estaciones.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    color: e.color,
    lineas: final.filter((l) => l.estacionId === e.id),
  }));

  res.json(grouped);
});

/* =========================================
   CAMBIAR ESTADO
========================================= */

r.patch("/:lineaId/estado", async (req, res) => {
  const lineaId = Number(req.params.lineaId);

  const { estadoOperativo } = req.body;

  await pool.execute(
    `
    UPDATE ticket_lineas
    SET estado_operativo = ?
    WHERE id = ?
    `,
    [estadoOperativo, lineaId],
  );

  // =====================================
  // OBTENER TICKET
  // =====================================

  const [[linea]] = await pool.query(
    `
    SELECT ticket_id
    FROM ticket_lineas
    WHERE id = ?
    `,
    [lineaId],
  );

  // =====================================
  // SOCKET EVENTS
  // =====================================

  io.emit("cocina:update");

  io.emit("ticket:update", linea.ticket_id);

  io.emit("mesas:update");

  res.json({
    ok: true,
  });
});

export default r;
