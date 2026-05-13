import { pool } from "../src/db/pool.js";

import { obtenerPropiedadesLineas } from "./obtenerPropiedadesLineas.js";

export async function obtenerLineasCocina() {
  // =====================================
  // LÍNEAS COCINA
  // =====================================

  const [lineas] = await pool.query(
    `
    SELECT
      tl.*,
      t.mesa_id
    FROM ticket_lineas tl
    JOIN tickets t
      ON t.id = tl.ticket_id
    WHERE tl.lifecycle_status = 'activo'
      AND tl.estatus_operacional IN (
        'enviado',
        'preparando',
        'listo'
      )
    ORDER BY tl.creado_en ASC
    `,
  );

  const lineasIds = lineas.map((l) => l.id);
  const propsPorLinea = await obtenerPropiedadesLineas(lineasIds);

  return lineas.map((linea) => ({
    ...linea,

    propiedades: propsPorLinea[linea.id] || [],
  }));
}
