import { pool } from "../../src/db/pool.js";

export async function eliminarArticulo({ negocioId, articuloId }) {
  const [result] = await pool.query(
    `
      UPDATE stock_articulos
      SET activo = 0
      WHERE negocio_id = ?
        AND id = ?
        AND activo = 1
    `,
    [negocioId, articuloId],
  );

  if (!result.affectedRows) {
    throw new Error("ARTICULO_STOCK_NO_ENCONTRADO");
  }

  return { ok: true };
}
