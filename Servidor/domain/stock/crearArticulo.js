import { pool } from "../../src/db/pool.js";

export async function crearArticulo({
  negocioId,
  nombre,
  unidad = "unidad",
  stockActual = 0,
  stockMinimo = 0,
  costeMedio = 0,
  fraccionable = false,
  fraccionesPorUnidad = null,
  nombreFraccion = null,
}) {
  const nombreLimpio = String(nombre ?? "").trim();
  const unidadLimpia = String(unidad ?? "").trim() || "unidad";

  if (!nombreLimpio) {
    throw new Error("NOMBRE_ARTICULO_REQUERIDO");
  }

  if (Number(stockActual) < 0 || Number(stockMinimo) < 0) {
    throw new Error("STOCK_NO_PUEDE_SER_NEGATIVO");
  }

  if (Number(costeMedio) < 0) {
    throw new Error("COSTE_NO_PUEDE_SER_NEGATIVO");
  }

  const esFraccionable = Boolean(fraccionable);

  let fracciones = null;
  let fraccionNombre = null;

  if (esFraccionable) {
    fracciones = Number(fraccionesPorUnidad);

    if (!Number.isFinite(fracciones) || fracciones <= 0) {
      throw new Error("FRACCIONES_POR_UNIDAD_INVALIDAS");
    }

    fraccionNombre = String(nombreFraccion ?? "").trim() || null;
  }

  const [result] = await pool.query(
    `
      INSERT INTO stock_articulos (
        negocio_id,
        nombre,
        unidad,
        stock_actual,
        stock_minimo,
        coste_medio,
        fraccionable,
        fracciones_por_unidad,
        nombre_fraccion
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      negocioId,
      nombreLimpio,
      unidadLimpia,
      Number(stockActual),
      Number(stockMinimo),
      Number(costeMedio),
      esFraccionable ? 1 : 0,
      fracciones,
      fraccionNombre,
    ],
  );

  return {
    id: result.insertId,
    nombre: nombreLimpio,
    unidad: unidadLimpia,
    stockActual: Number(stockActual),
    stockMinimo: Number(stockMinimo),
    costeMedio: Number(costeMedio),
    fraccionable: esFraccionable,
    fraccionesPorUnidad: fracciones,
    nombreFraccion: fraccionNombre,
  };
}
