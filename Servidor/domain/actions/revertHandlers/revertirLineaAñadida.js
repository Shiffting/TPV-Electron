import { crearSnapshotLinea } from "../../helpers/crearSnapshotLinea.js";

export async function revertirLineaAñadida({ conn, payload }) {
  const [[linea]] = await conn.query(
    `
    SELECT *
    FROM ticket_lineas
    WHERE id = ?
    LIMIT 1
    FOR UPDATE
    `,
    [payload.lineaId],
  );

  if (!linea) {
    throw new Error("LINEA_NO_ENCONTRADA");
  }

  return await crearSnapshotLinea({
    conn,
    lineaOriginal: linea,
    overrides: {
      lifecycle_status: "anulado",
    },
  });
}
