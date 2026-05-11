const { v4: uuidv4 } = require("uuid");
const db = require("../db");

async function appendTicketAction({
  ticketId,
  actionType,
  payload,
  actorUserId = null,
  deviceId = null,
  causedByActionUuid = null,
}) {
  const actionUuid = uuidv4();

  await db.query(
    `
    INSERT INTO ticket_actions (
      action_uuid,
      ticket_id,
      action_type,
      payload,
      actor_user_id,
      device_id,
      caused_by_action_uuid
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      actionUuid,
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

module.exports = {
  appendTicketAction,
};
