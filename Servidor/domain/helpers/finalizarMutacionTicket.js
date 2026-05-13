import { recalcularTicket } from "../tickets/recalcularTicket.js";
import { incrementarVersionTicket } from "./incrementarVersionTicket.js";
import { emitirActualizacionTicket } from "../../events/emitirActualizacionTicket.js";

//Todos los handlers hacen lo mismo al final en este orden, asi que ahorramos codigo
export async function finalizarMutacionTicket({ conn, ticketId }) {
  const nuevaVersion = await incrementarVersionTicket(conn, ticketId);

  const snapshot = await recalcularTicket(conn, ticketId);

  await conn.commit();

  try {
    await emitirActualizacionTicket(ticketId);
  } catch (err) {
    console.error(
      "Error emitiendo actualización de ticket:",
      err
    );
  }

  return {
    version: nuevaVersion,
    snapshot,
  };
}
