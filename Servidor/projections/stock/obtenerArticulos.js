import { pool } from "../../src/db/pool.js";

export async function obtenerArticulos({ negocioId, incluirInactivos = false }) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        nombre,
        unidad,
        stock_actual AS stockActual,
        stock_minimo AS stockMinimo,
        coste_medio AS costeMedio,
        fraccionable,
        fracciones_por_unidad AS fraccionesPorUnidad,
        nombre_fraccion AS nombreFraccion,
        activo,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM stock_articulos
      WHERE negocio_id = ?
        ${incluirInactivos ? "" : "AND activo = 1"}
      ORDER BY nombre ASC
    `,
    [negocioId],
  );

  return rows;
}
