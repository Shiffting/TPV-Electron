import { Router } from "express";
import { pool } from "../db/pool.js";
import {
  CrearTicketSchema,
  AddLineaSchema,
  PagarParcialSchema,
} from "../lib/validators.js";
import { audit } from "../lib/audit.js";
import { io } from "../app.js";
import { agregarLinea } from "../../domain/tickets/agregarLinea.js";
import { enviarTicketACocina } from "../../domain/tickets/enviarTicketACocina.js";
import { decrementarLinea } from "../../domain/tickets/decrementarLinea.js";
import { editarLinea } from "../../domain/tickets/editarLinea.js";
import { agregarPago } from "../../domain/pagos/agregarPago.js";
import { deshacerUltimaAccion } from "../../domain/actions/deshacerUltimaAccion.js";
import { obtenerLineasVisualesTicket } from "../../projections/obtenerLineasVisualesTicket.js";
import { obtenerTimelineTicket } from "../../projections/obtenerTimelineTicket.js";
import { obtenerHistorialLinea } from "../../projections/obtenerHistorialLinea.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { ACTION_TYPES } from "../../domain/constants/actionTypes.js";

const r = Router();

/***********************************
        GENERAR TICKET
************************************
    -Validamos request
    -Empezamos transacción
    -Metemos en BD
    -Registramos acción
    -Commit
    -Metemos en auditoría
************************************/
r.post("/", async (req, res) => {
  const parse = CrearTicketSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.issues);
  const { mesaId = null } = parse.data;

  const conn = await pool.getConnection();
  try {
    await conn.comenzarTransaccion();
    const [ins] = await conn.execute(
      'INSERT INTO tickets (mesa_id, estatus_financiero, version) VALUES (?, "simpa", 1)',
      [mesaId],
    );
    const ticketId = ins.insertId;
    await adjuntarAccionDeTicket({
      conn,
      ticketId,
      actionType: ACTION_TYPES.TICKET_CREATED,
      payload: {
        mesaId,
      },
      actorUserId: req.user?.uid || null,
      aggregateVersion: 1,
    });
    await conn.commit();
    await audit({
      usuarioId: req.user?.uid || null,
      accion: ACTION_TYPES.TICKET_CREATED,
      detalle: { ticketId, mesaId },
    });
    io.emit("mesas:update");
    res.json({ ticketId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// =========================================
// ADD PAYMENT
// =========================================

r.post("/:ticketId/pago", async (req, res) => {
  const parse = PagarParcialSchema.safeParse(req.body);
  const { metodoCodigo, importe } = parse.data;
  const ticketId = Number(parse.params.ticketId);

  try {
    const result = await agregarPago({
      ticketId,
      metodoCodigo,
      importe,
      usuarioId: req.user?.uid || null,
    });

    await audit({
      usuarioId: req.user?.uid || null,
      accion: ACTION_TYPES.PAYMENT_ADDED,
      detalle: {
        ticketId,
        paymentId: result.paymentId,
        importe,
        metodoCodigo,
      },
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

// Obtener ticket completo (cabecera + lineas + propiedades + pagos)
r.get("/:ticketId", async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const [[tk]] = await pool.query("SELECT * FROM tickets WHERE id=?", [
    ticketId,
  ]);
  if (!tk) return res.status(404).json({ error: "Ticket no encontrado" });

  const lineas = await obtenerLineasVisualesTicket(ticketId);

  const [pagos] = await pool.query(
    `SELECT pg.*, mp.codigo, mp.nombre AS metodo_nombre
     FROM pagos pg
     JOIN metodos_pago mp ON mp.id = pg.metodo_id
     WHERE pg.ticket_id=?
     ORDER BY pg.id`,
    [ticketId],
  );

  res.json({
    ticket: {
      id: tk.id,
      mesaId: tk.mesa_id,
      estatusFinanciero: tk.estatus_financiero,
      totalBruto: Number(tk.total_bruto),
      totalNeto: Number(tk.total_neto),
      creadoEn: tk.creado_en,
      cerradoEn: tk.cerrado_en,
    },
    lineas,
    pagos,
    version: tk.version,
  });
});

// =========================================
// AÑADIR LÍNEA
// =========================================

r.post("/:ticketId/lineas", async (req, res) => {
  const parse = AddLineaSchema.safeParse(req.body);

  if (!parse.success) {
    return res.status(400).json(parse.error.issues);
  }

  const ticketId = Number(req.params.ticketId);

  try {
    const result = await agregarLinea({
      ticketId,
      ...parse.data,
      expectedVersion: req.body.expectedVersion,
      usuarioId: req.user?.uid || null,
    });

    await audit({
      usuarioId: req.user?.uid || null,
      accion: ACTION_TYPES.LINE_ADDED,
      detalle: {
        ticketId,
        lineaId: result.lineaId,
      },
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

// =========================================
// EDITAR LÍNEA
// =========================================

r.patch("/lineas/:lineaId", async (req, res) => {
  const lineaId = Number(req.params.lineaId);

  const { propiedades = [] } = req.body;

  try {
    const result = await editarLinea({
      lineaId,
      propiedades,
      usuarioId: req.user?.uid || null,
    });

    await audit({
      usuarioId: req.user?.uid || null,
      accion: ACTION_TYPES.LINE_SUPERSEDED,
      detalle: {
        lineaId,
        nuevaLineaId: result.nuevaLineaId,
      },
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

// =========================================
// DECREMENTAR LÍNEA
// =========================================

r.post("/lineas/:lineaId/decrementar", async (req, res) => {
  const lineaId = Number(req.params.lineaId);

  try {
    const result = await decrementarLinea({
      lineaId,
      usuarioId: req.user?.uid || null,
    });

    await audit({
      usuarioId: req.user?.uid || null,
      accion: ACTION_TYPES.LINE_DECREMENTED,
      detalle: {
        lineaId,
      },
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

// =========================================
// ENVIAR A COCINA
// =========================================

r.post("/:ticketId/send", async (req, res) => {
  const ticketId = Number(req.params.ticketId);

  try {
    const result = await enviarTicketACocina({
      ticketId,
      usuarioId: req.user?.uid || null,
    });

    await audit({
      usuarioId: req.user?.uid || null,
      accion: ACTION_TYPES.SENT_TO_KITCHEN,
      detalle: {
        ticketId,
        enviado: result.enviado,
      },
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

// =========================================
// DESHACER ÚLTIMA ACCIÓN
// =========================================

r.post("/:ticketId/deshacer", async (req, res) => {
  const ticketId = Number(req.params.ticketId);

  try {
    const result = await deshacerUltimaAccion({
      ticketId,
      usuarioId: req.user?.uid || null,
    });

    await audit({
      usuarioId: req.user?.uid || null,
      accion: ACTION_TYPES.ACTION_REVERTED,
      detalle: {
        ticketId,
        reversed: result.reversed,
      },
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

// =========================================
// TIMELINE TICKET
// =========================================

r.get("/:ticketId/timeline", async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const timeline = await obtenerTimelineTicket(ticketId);
  res.json(timeline);
});

r.get("/lineas/:lineGroupUuid/historial", async (req, res) => {
  const historial = await obtenerHistorialLinea(req.params.lineGroupUuid);
  res.json(historial);
});

export default r;
