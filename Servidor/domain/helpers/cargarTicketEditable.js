import { validarTicketEditable } from "../policies/validarTicketEditable.js";
import { validarVersionTicket } from "../policies/validarVersionTicket.js";

export async function cargarTicketEditable({
  conn,
  ticketId,
  expectedVersion = null,
}) {
  const [[ticket]] = await conn.query(
    `
      SELECT *
      FROM tickets
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
    [ticketId],
  );

  if (!ticket) {
    throw new Error(`Ticket ${ticketId} no encontrado`);
  }
  
  validarTicketEditable(ticket);

  validarVersionTicket({
    actual: ticket.version,
    esperada: expectedVersion,
  });

  return ticket;
}
