import { Router } from "express";

import { crearTicket } from "../../domain/tickets/crearTicket.js";
import { editarTicket } from "../../domain/tickets/editarTicket.js";
import { obtenerTicket } from "../../projections/tickets/obtenerTicket.js";
import { obtenerTickets } from "../../projections/tickets/obtenerTickets.js";

const r = Router();

/* =========================================
   OBTENER TICKETS
========================================= */

r.get("/", async (req, res) => {
  try {
    const tickets = await obtenerTickets(req.query);

    res.json(tickets);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   OBTENER TICKET
========================================= */

r.get("/:ticketId", async (req, res) => {
  try {
    const ticket = await obtenerTicket({
      ticketId: Number(req.params.ticketId),
    });

    res.json(ticket);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   CREAR TICKET
========================================= */

r.post("/", async (req, res) => {
  try {
    const result = await crearTicket({
      mesaId: req.body.mesaId || null,
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   EDITAR TICKET
========================================= */

r.patch("/:ticketId", async (req, res) => {
  try {
    const result = await editarTicket({
      ticketId: Number(req.params.ticketId),
      accion: req.body.accion,
      payload: req.body.payload || {},
      versionEsperada: Number(req.body.version),
      usuarioId: req.user?.uid || null,
    });

    res.json(result);
  } catch (e) {
    // =====================================
    // CONFLICTO CONCURRENCIA
    // =====================================

    if (e.message.startsWith("CONFLICTO_DE_VERSION")) {
      return res.status(409).json({
        error: e.message,
      });
    }

    res.status(500).json({
      error: e.message,
    });
  }
});

export default r;