export async function recalcularTotalesTicket({
    conn,
    ticketId,
}) {
    // =====================================
    // TOTAL ACTIVO
    // =====================================

    const [[totales]] = await conn.query(
        `
    SELECT
      COALESCE(SUM(total_linea), 0) AS total

    FROM ticket_lineas

    WHERE ticket_id = ?
      AND lifecycle_status = 'activo'
      AND estatus_operacional != 'cancelado'
    `,
        [ticketId],
    );

    const total = Number(totales.total);

    // =====================================
    // ACTUALIZAR TICKET
    // =====================================

    await conn.execute(
        `
    UPDATE tickets
    SET total_bruto = ?
    WHERE id = ?
    `,
        [
            total,
            ticketId,
        ],
    );

    return total;
}