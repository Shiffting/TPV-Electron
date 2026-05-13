import { pool } from "../../src/db/pool.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { recalcularTicket } from "../tickets/recalcularTicket.js";
import { emitirActualizacionTicket } from "../../events/emitirActualizacionTicket.js";
import { incrementarVersionTicket } from "../helpers/incrementarVersionTicket.js";
import { cargarTicketEditable } from "../helpers/cargarTicketEditable.js";
import { finalizarMutacionTicket } from "../helpers/finalizarMutacionTicket.js";
import { ACTION_TYPES } from "../constants/actionTypes.js";
import { ESTATUS_FINANCIERO } from "../constants/estatusFinanciero.js";

export async function agregarPago({
  ticketId,
  metodoCodigo,
  importe,
  usuarioId = null,
  expectedVersion = null,
}) {
  const conn = await pool.getConnection();

  try {
    await conn.comenzarTransaccion();

    // =====================================
    // TICKET
    // =====================================

    const ticket = await cargarTicketEditable({
      conn,
      ticketId,
      expectedVersion,
    });

    // =====================================
    // MÉTODO
    // =====================================

    const [[metodo]] = await conn.query(
      `
      SELECT *
      FROM metodos_pago
      WHERE codigo = ?
        AND activo = 1
      LIMIT 1
      `,
      [metodoCodigo],
    );

    if (!metodo) {
      throw new Error("Método inválido");
    }

    // =====================================
    // INSERT PAYMENT
    // =====================================

    const [paymentInsert] = await conn.execute(
      `
      INSERT INTO pagos
      (
        ticket_id,
        metodo_id,
        importe
      )
      VALUES (?, ?, ?)
      `,
      [ticketId, metodo.id, importe],
    );

    const [[totales]] = await conn.query(
      `
      SELECT
        total_bruto
      FROM tickets
      WHERE id = ?
      LIMIT 1
      `,
      [ticketId],
    );

    const totalTicket = Number(totales.total_bruto);

    const totalPagado = Number(importe);

    let estatusFinanciero = ESTATUS_FINANCIERO.PARCIAL;

    if (totalPagado >= totalTicket) {
      estatusFinanciero = ESTATUS_FINANCIERO.PAGADO;
    }

    await conn.execute(
      `
      UPDATE tickets
      SET
        estatus_financiero = ?,
        cerrado_en =
          CASE
            WHEN ? = 'pagado'
            THEN NOW()
            ELSE cerrado_en
          END
      WHERE id = ?
      `,
      [estatusFinanciero, estatusFinanciero, ticketId],
    );

    const paymentId = paymentInsert.insertId;

    //Append
    await adjuntarAccionDeTicket({
      conn,
      ticketId,
      actionType: ACTION_TYPES.PAYMENT_ADDED,
      payload: {
        paymentId,
        metodoCodigo,
        importe,
      },
      actorUserId: usuarioId,
      aggregateVersion: ticket.version + 1,
    });

    const { version } = await finalizarMutacionTicket({
      conn,
      ticketId
    });

    return {
      ok: true,
      paymentId,
      totalPagado: snapshot.totalPagado,
      totalTicket: snapshot.totalTicket,
      estatusFinanciero: snapshot.estatusFinanciero,
      version
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
