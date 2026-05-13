import { pool } from "../src/db/pool.js";
import { v4 as uuidv4 } from "uuid";

export async function adjuntarAccionDeTicket({
  conn = null,
  ticketId,
  actionType,
  payload,
  actorUserId = null,
  deviceId = null,
  causedByActionUuid = null,
  commandUuid = null,
  aggregateVersion,
}) {
  const actionUuid = uuidv4();
  const executor = conn || pool;

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
      caused_by_action_uuid
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      actionUuid,
      commandUuid,
      aggregateVersion,
      ticketId,
      actionType,
      JSON.stringify(payload),
      actorUserId,
      deviceId,
      causedByActionUuid,
    ],
  );

  return actionUuid;
}
