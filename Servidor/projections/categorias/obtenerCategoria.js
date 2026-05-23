import { pool } from "../../src/db/pool.js";

export async function obtenerCategoria({
    categoriaId,
}) {

    const [[categoria]] = await pool.query(
        `
    SELECT
      id,
      nombre
    FROM categorias
    WHERE id = ?
    LIMIT 1
    `,
        [categoriaId],
    );

    if (!categoria) {
        throw new Error(
            "CATEGORIA_NO_ENCONTRADA",
        );
    }

    return {
        id: categoria.id,

        nombre: categoria.nombre,
    };
}