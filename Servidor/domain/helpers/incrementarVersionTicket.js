export async function incrementarVersionTicket({
    conn,
    ticketId,
}) {
    // =====================================
    // INCREMENTAMOS
    // =====================================

    await conn.execute(
        `
        UPDATE tickets
        SET version = version + 1
        WHERE id = ?
        `,
        [ticketId],
    );

    // =====================================
    // OBTENEMOS NUEVA VERSIÓN
    // =====================================

    const [[ticket]] = await conn.query(
        `
        SELECT version
        FROM tickets
        WHERE id = ?
        LIMIT 1
        `,
        [ticketId],
    );

    return ticket.version;
}