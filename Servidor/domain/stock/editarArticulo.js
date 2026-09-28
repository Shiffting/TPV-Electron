import { pool } from "../../src/db/pool.js";

export async function editarArticulo({
  negocioId,
  articuloId,
  cambios,
}) {
  const permitidos = new Set([
    "nombre",
    "unidad",
    "stock_minimo",
    "coste_medio",
    "fraccionable",
    "fracciones_por_unidad",
    "nombre_fraccion",
    "activo",
  ]);

  const entries = Object.entries(cambios ?? {})
    .filter(([campo]) => permitidos.has(campo));

  if (!entries.length) {
    throw new Error("SIN_CAMBIOS");
  }

  const values = [];

  const sets = entries.map(([campo, valor]) => {
    if (campo === "nombre") {
      const limpio = String(valor ?? "").trim();
      if (!limpio) throw new Error("NOMBRE_ARTICULO_REQUERIDO");
      values.push(limpio);
    } else if (campo === "fraccionable") {
      values.push(valor ? 1 : 0);
    } else if (
      ["stock_minimo", "coste_medio", "fracciones_por_unidad"].includes(campo)
    ) {
      const numero = Number(valor);
      if (!Number.isFinite(numero) || numero < 0) {
        throw new Error(`VALOR_INVALIDO_${campo.toUpperCase()}`);
      }
      if (campo === "fracciones_por_unidad" && numero === 0) {
        throw new Error("FRACCIONES_POR_UNIDAD_INVALIDAS");
      }
      values.push(numero);
    } else {
      values.push(valor);
    }

    return `${campo} = ?`;
  });

  values.push(negocioId, articuloId);

  const [result] = await pool.query(
    `
      UPDATE stock_articulos
      SET ${sets.join(", ")}
      WHERE negocio_id = ?
        AND id = ?
    `,
    values,
  );

  if (!result.affectedRows) {
    throw new Error("ARTICULO_STOCK_NO_ENCONTRADO");
  }

  const [[articulo]] = await pool.query(
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
        activo
      FROM stock_articulos
      WHERE negocio_id = ?
        AND id = ?
      LIMIT 1
    `,
    [negocioId, articuloId],
  );

  return articulo;
}
