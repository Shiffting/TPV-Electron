import { pool } from "../src/db/pool.js";
import { v4 as uuidv4 } from "uuid";

export async function adjuntarAccionDeTicket({
  conn = null,
  ticketId,
  tipoAccion,
  payload,
  actorUserId = null,
  empleadoId = null,
  deviceId = null,
  causedByActionUuid = null,
  commandUuid = null,
  aggregateVersion,
}) {

  const actionUuid =
    uuidv4();

  const executor =
    conn || pool;

  await executor.query(
    `
    INSERT INTO ticket_actions (
      action_uuid,
      command_uuid,
      aggregate_version,
      ticket_id,
      action_type,
      payload,
      actor_user_id,
      device_id,
      caused_by_action_uuid,
      empleado_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      actionUuid,
      commandUuid,
      aggregateVersion,
      ticketId,
      tipoAccion,
      JSON.stringify(payload),
      actorUserId,
      deviceId,
      causedByActionUuid,
      payload.empleadoId
    ],
  );

  io.emit(
    "ticket:update",
    {
      ticketId,
      tipoAccion,
    }
  );

  return actionUuid;
}