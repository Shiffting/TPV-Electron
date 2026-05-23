export async function recalcularEstadoFinancieroTicket({
    conn,
    ticketId,
}) {

    // =====================================
    // TOTAL PAGADO
    // =====================================

    const [[pagos]] = await conn.query(
        `
        SELECT
            COALESCE(
                SUM(importe),
                0
            ) AS total
        FROM pagos
        WHERE ticket_id = ?
        `,
        [ticketId],
    );

    const totalPagado =
        Number(pagos.total);

    // =====================================
    // TOTAL TICKET
    // =====================================

    const [[ticket]] = await conn.query(
        `
        SELECT total_bruto
        FROM tickets
        WHERE id = ?
        LIMIT 1
        `,
        [ticketId],
    );

    const totalTicket =
        Number(ticket.total_bruto);

    // =====================================
    // ESTADO
    // =====================================

    let estado =
        "pendiente";

    if (totalPagado > 0) {
        estado = "parcial";
    }

    if (
        totalPagado >=
        totalTicket
    ) {
        estado = "pagado";
    }

    // =====================================
    // UPDATE
    // =====================================

    await conn.execute(
        `
        UPDATE tickets
        SET estatus_financiero = ?
        WHERE id = ?
        `,
        [
            estado,
            ticketId,
        ],
    );

    return estado;
}