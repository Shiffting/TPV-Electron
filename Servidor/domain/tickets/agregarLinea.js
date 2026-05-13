import { pool } from "../../src/db/pool.js";
import crypto from "crypto";

import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { recalcularTicket } from "./recalcularTicket.js";
import { emitirActualizacionTicket } from "../../events/emitirActualizacionTicket.js";
import { validarTicketEditable } from "../policies/validarTicketEditable.js";
import { asegurarCommandUnico } from "../helpers/asegurarCommandUnico.js";
import { incrementarVersionTicket } from "../helpers/incrementarVersionTicket.js";
import { validarVersionTicket } from "../policies/validarVersionTicket.js";
import { cargarTicketEditable } from "../helpers/cargarTicketEditable.js";
import { ACTION_TYPES } from "../constants/actionTypes.js";
import { finalizarMutacionTicket } from "../helpers/finalizarMutacionTicket.js";

export async function agregarLinea({
  ticketId,
  productoId,
  nombreProducto,
  cantidad = 1,
  pvp,
  pvpBase,
  propiedades = [],
  usuarioId = null,
  commandUuid = null,
  expectedVersion = null,
}) {
  const conn = await pool.getConnection();

  try {
    await conn.comenzarTransaccion();
    await asegurarCommandUnico({
      conn,
      commandUuid,
    });

    await cargarTicketEditable({
      conn,
      ticketId,
      expectedVersion,
    });

    const configHash = [
      productoId,
      ...propiedades
        .map((p) => p.propiedadId)
        .filter(Boolean)
        .sort((a, b) => a - b),
    ].join("|");

    const totalLinea = +(cantidad * pvp).toFixed(2);

    const lineGroupUuid = crypto.randomUUID();

    const [ins] = await conn.execute(
      `INSERT INTO ticket_lineas
        (
          line_group_uuid,
          ticket_id,
          producto_id,
          nombre_producto,
          cantidad,
          pvp,
          pvp_base,
          total_linea,
          estatus_financiero,
          estatus_operacional,
          config_hash
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, 'simpa', 'pendiente', ?)
        `,
      [
        lineGroupUuid,
        ticketId,
        productoId,
        nombreProducto,
        cantidad,
        pvp,
        pvpBase,
        totalLinea,
        configHash,
      ],
    );

    const lineaId = ins.insertId;

    // =====================================
    // PROPIEDADES
    // =====================================

    for (const prop of propiedades) {
      await conn.execute(
        `
        INSERT INTO ticket_linea_propiedades
        (
          ticket_linea_id,
          propiedad_id,
          precio_delta
        )
        VALUES (?, ?, ?)
        `,
        [lineaId, prop.propiedadId ?? null, prop.precioDelta ?? 0],
      );
    }

    //Append
    await adjuntarAccionDeTicket({
      conn,
      ticketId,
      actionType: ACTION_TYPES.LINE_ADDED,
      payload: {
        lineaId,
        productoId,
        nombreProducto,
        cantidad,
        pvp,
        pvpBase,
        propiedades,
      },
      actorUserId: usuarioId,
      commandUuid,
      aggregateVersion: null,
    });

    const { version } = await finalizarMutacionTicket({ conn, ticketId });

    return {
      ok: true,
      lineaId,
      version,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
