import { Router } from "express";
import { pool } from "../db/pool.js";

const r = Router();

// Listar mesas con estado e items pendientes
r.get("/", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      m.id,
      m.nombre,
      s.nombre AS sala_nombre,
      s.suplemento AS sala_suplemento,

      CASE
        WHEN EXISTS (
          SELECT 1
          FROM ticket_lineas tl

          JOIN tickets t
            ON t.id = tl.ticket_id

          WHERE t.mesa_id = m.id
            AND t.estatus_financiero IN ('abierto', 'parcial')
            AND tl.estatus_financiero = 'simpa'
        )
        THEN 'ocupada'
        ELSE 'libre'
      END AS estado,

      COALESCE((
        SELECT SUM(tl.cantidad)
        FROM ticket_lineas tl

        JOIN tickets t
          ON t.id = tl.ticket_id

        WHERE t.mesa_id = m.id
          AND t.estatus_financiero IN ('abierto', 'parcial')
          AND tl.estatus_financiero = 'simpa'
      ), 0) AS items_pendientes,

      COALESCE((
        SELECT SUM(tl.total_linea)
        FROM ticket_lineas tl

        JOIN tickets t
          ON t.id = tl.ticket_id

        WHERE t.mesa_id = m.id
          AND t.estatus_financiero IN ('abierto', 'parcial')
      ), 0) AS total

    FROM mesas m

    LEFT JOIN salas s
      ON s.id = m.sala_id

    ORDER BY m.id
  `);

  res.json(rows);
});

// Bloquear mesa para que no accedan mas de una persona a la vez
r.post("/:id/lock", async (req, res) => {
  const mesaId = Number(req.params.id);

  const userId = req.user.uid;
  const deviceId = req.headers["x-device-id"];

  const [[mesa]] = await pool.query(
    `
    SELECT
      locked_by,
      locked_device,

      TIMESTAMPDIFF(
        SECOND,
        locked_at,
        NOW()
      ) AS lock_age

    FROM mesas

    WHERE id = ?
  `,
    [mesaId],
  );

  console.log("MESA ACTUAL");
  console.log(mesa);

  console.log("DEVICE ACTUAL");
  console.log(deviceId);

  // =====================================
  // YA BLOQUEADA
  // =====================================

  if (
    mesa.locked_device &&
    mesa.locked_device !== deviceId &&
    mesa.lock_age !== null &&
    mesa.lock_age < 90
  ) {
    return res.status(409).json({
      error: "Mesa en uso",
    });
  }

  // =====================================
  // BLOQUEAR
  // =====================================

  await pool.execute(
    `
    UPDATE mesas
    SET
      locked_by = ?,
      locked_device = ?,
      locked_at = NOW()
    WHERE id = ?
    `,
    [userId, deviceId, mesaId],
  );
  console.log("LOCK GUARDADO");

  res.json({
    ok: true,
  });
});

//Desbloquear mesa
r.post("/:id/unlock", async (req, res) => {
  const mesaId = Number(req.params.id);
  const deviceId = req.headers["x-device-id"];

  await pool.execute(
    `
    UPDATE mesas
    SET
      locked_by = NULL,
      locked_device = NULL,
      locked_at = NULL
    WHERE id = ?
      AND locked_device = ?
    `,
    [mesaId, deviceId],
  );

  res.json({
    ok: true,
  });
});

r.get("/:id/ticket-abierto", async (req, res) => {
  const mesaId = Number(req.params.id);

  const [[ticket]] = await pool.query(
    `SELECT id
     FROM tickets
     WHERE mesa_id = ?
       AND estatus_financiero IN ('abierto', 'parcial')
     ORDER BY id DESC
     LIMIT 1`,
    [mesaId],
  );

  if (!ticket) {
    return res.json({ ticketId: null });
  }

  res.json({ ticketId: ticket.id });
});

//Renovamos periodicamente el lock
r.post("/:id/ping-lock", async (req, res) => {
  const mesaId = Number(req.params.id);
  const deviceId = req.headers["x-device-id"];

  await pool.execute(
    `
    UPDATE mesas
    SET locked_at = NOW()
    WHERE id = ?
      AND locked_device = ?
    `,
    [mesaId, deviceId],
  );

  res.json({
    ok: true,
  });
});

export default r;
