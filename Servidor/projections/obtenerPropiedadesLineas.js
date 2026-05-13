import { pool } from "../src/db/pool.js";

export async function obtenerPropiedadesLineas(
  lineasIds,
) {
  if (!lineasIds.length) {
    return {};
  }

  const [props] = await pool.query(
    `
    SELECT
      lp.*,
      p.nombre AS propiedad_nombre
    FROM ticket_linea_propiedades lp
    LEFT JOIN propiedades p
      ON p.id = lp.propiedad_id
    WHERE lp.ticket_linea_id IN (${lineasIds.map(() => "?").join(",")})
    ORDER BY lp.id
    `,
    lineasIds,
  );

  // =====================================
  // AGRUPAR POR LÍNEA
  // =====================================

  return props.reduce((acc, prop) => {
    if (!acc[prop.ticket_linea_id]) {
      acc[prop.ticket_linea_id] = [];
    }

    acc[prop.ticket_linea_id].push(prop);

    return acc;
  }, {});
}