export async function cargarTicket({
    conn,
    ticketId,
}) {
    // =====================================
    // BUSCAMOS TICKET
    // =====================================

    const [[ticket]] = await conn.query(
        `
        SELECT *
        FROM tickets
        WHERE id = ?
        LIMIT 1
        `,
        [ticketId],
    );

    // =====================================
    // VALIDAMOS EXISTENCIA
    // =====================================

    if (!ticket) {
        throw new Error("TICKET_NO_ENCONTRADO");
    }

    // =====================================
    // DEVOLVEMOS TICKET
    // =====================================

    return ticket;
}