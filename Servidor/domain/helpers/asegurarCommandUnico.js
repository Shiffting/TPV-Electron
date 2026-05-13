export async function asegurarCommandUnico({ conn, commandUuid }) {
  if (!commandUuid) {
    return;
  }

  const [[existing]] = await conn.query(
    `
      SELECT id
      FROM ticket_actions
      WHERE command_uuid = ?
      LIMIT 1
      `,
    [commandUuid],
  );

  if (existing) {
    throw new Error("COMMAND_ALREADY_PROCESSED");
  }
}
