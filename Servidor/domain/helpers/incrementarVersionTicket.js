export async function incrementarVersionTicket(conn, ticketId) {
  const [result] = await conn.query(
    `
    UPDATE tickets
    SET version = version + 1
    WHERE id = ?
    `,
    [ticketId],
  );

  if (result.affectedRows !== 1) {
    throw new Error(
      `No se pudo incrementar versión del ticket ${ticketId}`
    );
  }

  const [[ticket]] = await conn.query(
    `
      SELECT version
      FROM tickets
      WHERE id = ?
      LIMIT 1
      `,
    [ticketId],
  );

  if (!ticket) {
    throw new Error(
      `Ticket ${ticketId} no encontrado tras incrementar versión`
    );
  }

  return ticket.version;
}
