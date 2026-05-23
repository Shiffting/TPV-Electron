import { pool } from "../../src/db/pool.js";

export async function obtenerCategorias() {

    const [categorias] = await pool.query(
        `
    SELECT
      id,
      nombre
    FROM categorias
    ORDER BY nombre ASC
    `,
    );

    return categorias.map((c) => ({
        id: c.id,

        nombre: c.nombre,
    }));
}