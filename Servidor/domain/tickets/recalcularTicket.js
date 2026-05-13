import { assertSingleActiveSnapshot } from "../helpers/assertSingleActiveSnapshot";
import { ESTATUS_FINANCIERO } from "../constants/estatusFinanciero";

export async function recalcularTicket(conn, ticketId) {
  // =====================================
  // TOTAL ACTIVO
  // =====================================

  const [lineasActivas] = await conn.query(
    `
      SELECT
        id,
        line_group_uuid
      FROM ticket_lineas
      WHERE ticket_id = ?
        AND lifecycle_status = 'activo'
    `,
    [ticketId],
  );

  assertSingleActiveSnapshot(lineasActivas);

  const [[totales]] = await conn.query(
    `
    SELECT
      COALESCE(SUM(total_linea), 0) AS total
    FROM ticket_lineas
    WHERE ticket_id = ?
      AND lifecycle_status = 'activo'
    `,
    [ticketId],
  );

  assertSingleActiveSnapshot(totales)

  const totalTicket = Number(totales.total);

  // =====================================
  // TOTAL PAGADO
  // =====================================

  const [[pagos]] = await conn.query(
    `
    SELECT
      COALESCE(SUM(importe), 0) AS total
    FROM pagos
    WHERE ticket_id = ?
    `,
    [ticketId],
  );

  const totalPagado = Number(pagos.total);

  // =====================================
  // ESTADO FINANCIERO DERIVADO
  // =====================================

  let estatusFinanciero = ESTATUS_FINANCIERO.SIMPA;

  if (totalPagado > 0) {
    estatusFinanciero = ESTATUS_FINANCIERO.PARCIAL;
  }

  if (totalTicket > 0 && totalPagado >= totalTicket) {
    estatusFinanciero = ESTATUS_FINANCIERO.PAGADO;
  }

  // =====================================
  // MATERIALIZAR SNAPSHOT
  // =====================================

  await conn.execute(
    `
    UPDATE tickets
    SET
      total_bruto = ?,
      total_neto = ?,
      closed_at =
      CASE
        WHEN ? = 'pagado' AND closed_at IS NULL
        THEN NOW()
        ELSE NULL
      END
        WHERE id = ?
    `,
    [totalTicket, totalTicket, estatusFinanciero, ticketId],
  );

  return {
    totalTicket,
    totalPagado,
    estatusFinanciero,
  };
}
