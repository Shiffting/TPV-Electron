import { pool } from "../src/db/pool.js";

export function emitirActualizacionTicket(ticketId) {
  io.emit("ticket:update", ticketId);
  io.emit("mesas:update");
  io.emit("cocina:update");
}
