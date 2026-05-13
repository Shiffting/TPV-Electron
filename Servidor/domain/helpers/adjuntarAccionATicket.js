import { v4 as uuidv4 } from "uuid";

export async function adjuntarAccionATicket({
    conn,
    ticketId,
    tipoAccion,
    payload = {},
    usuarioId = null,
    version = null,
}) {
    // =====================================
    // UUID ACCIÓN
    // =====================================

    const accionUuid = uuidv4();

    // =====================================
    // INSERT ACTION
    // =====================================

    await conn.execute(
        `
    INSERT INTO ticket_acciones
    (
      accion_uuid,
      ticket_id,
      tipo_accion,
      payload,
      usuario_id,
      version
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
        [
            accionUuid,
            ticketId,
            tipoAccion,
            JSON.stringify(payload),
            usuarioId,
            version,
        ],
    );

    return accionUuid;
}