import { pool } from "../src/db/pool.js";

import { obtenerLineasCocina } from "./obtenerLineasCocina.js";

export async function obtenerVistaCocina() {
  // =====================================
  // LÍNEAS
  // =====================================

  const lineas = await obtenerLineasCocina();

  // =====================================
  // ESTACIONES
  // =====================================

  const [estaciones] = await pool.query(`
      SELECT
        id,
        nombre,
        color
      FROM estaciones
      ORDER BY orden ASC, id ASC
    `);

  // =====================================
  // VIEW MODEL FINAL
  // =====================================

  return estaciones.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    color: e.color,
    cola: lineas.filter(
      (l) => l.estacionId === e.id && l.operationalStatus === "enviado",
    ),
    preparando: lineas.filter(
      (l) => l.estacionId === e.id && l.operationalStatus === "preparando",
    ),
    listo: lineas.filter(
      (l) => l.estacionId === e.id && l.operationalStatus === "listo",
    ),
  }));
}
