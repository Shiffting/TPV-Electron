export async function vincularSnapshotAAccion({ conn, lineaId, actionUuid }) {
  await conn.execute(
    `
    UPDATE ticket_lineas
    SET created_by_action_uuid = ?
    WHERE id = ?
    `,
    [actionUuid, lineaId],
  );
}
