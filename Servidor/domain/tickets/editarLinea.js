import { pool } from "../../src/db/pool.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { recalcularTicket } from "./recalcularTicket.js";
import { emitirActualizacionTicket } from "../../events/emitirActualizacionTicket.js";
import { validarVersionTicket } from "../policies/validarVersionTicket.js";
import { incrementarVersionTicket } from "../helpers/incrementarVersionTicket.js";
import { validarLineaActiva } from "../policies/validarLineaActiva.js";
import { cargarTicketEditable } from "../helpers/cargarTicketEditable.js";
import { crearSnapshotLinea } from "../helpers/crearSnapshotLinea.js";
import { ACTION_TYPES } from "../constants/actionTypes.js";
import { vincularSnapshotAAccion } from "../helpers/vincularSnapshotAAccion.js";
import { finalizarMutacionTicket } from "../helpers/finalizarMutacionTicket.js";

export async function editarLinea({
  lineaId,
  propiedades = [],
  usuarioId = null,
  expectedVersion = null,
}) {
  const conn = await pool.getConnection();

  try {
    await conn.comenzarTransaccion();
    // =====================================
    // LÍNEA ORIGINAL
    // =====================================

    const [[linea]] = await conn.query(
      `
      SELECT *
      FROM ticket_lineas
      WHERE id = ?
      LIMIT 1
      `,
      [lineaId],
    );

    await cargarTicketEditable({
      conn,
      ticketId: linea.ticket_id,
      expectedVersion,
    });

    validarLineaActiva(linea);

    // =====================================
    // NUEVO PRECIO
    // =====================================

    const extras = propiedades.reduce(
      (acc, p) => acc + Number(p.precioDelta || 0),
      0,
    );

    const nuevoPvp = Number(linea.pvp_base || linea.pvp) + extras;
    const nuevoTotal = nuevoPvp * linea.cantidad;
    const configHash = [
      linea.producto_id,
      ...propiedades
        .map((p) => p.propiedadId)
        .filter(Boolean)
        .sort((a, b) => a - b),
    ].join("|");

    //Cambiamos todo lo nuevo de una tirada
    const { nuevaLineaId } = await crearSnapshotLinea({
      conn,
      lineaOriginal: linea,
      overrides: {
        pvp: nuevoPvp,
        total_linea: nuevoTotal,
        config_hash: configHash,
        estatus_operacional: "pendiente",
      },
    });

    await conn.execute(
      `
      DELETE FROM
        ticket_linea_propiedades
      WHERE ticket_linea_id = ?
      `,
      [nuevaLineaId],
    );

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
        [nuevaLineaId, prop.propiedadId, prop.precioDelta || 0],
      );
    }

    const actionUuid = await adjuntarAccionDeTicket({
      conn,
      ticketId: linea.ticket_id,
      actionType: ACTION_TYPES.LINE_SUPERSEDED,
      payload: {
        oldLineaId: lineaId,
        newLineaId: nuevaLineaId,
      },
      actorUserId: usuarioId,
      aggregateVersion: null,
    });

    await vincularSnapshotAAccion({
      conn,
      lineaId: nuevaLineaId,
      actionUuid,
    });

    const { version } = await finalizarMutacionTicket({
      conn,
      ticketId: linea.ticket_id,
    });

    return {
      ok: true,
      nuevaLineaId,
      version,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
