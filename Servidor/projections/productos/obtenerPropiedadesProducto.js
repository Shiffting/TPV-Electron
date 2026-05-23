import { pool } from "../../src/db/pool.js";

export async function obtenerPropiedadesProducto(
    productoId,
) {

    const conn =
        await pool.getConnection();

    try {

        const [rows] =
            await conn.query(
                `
                SELECT
                    pp.id,
                    pp.nombre,
                    pp.precio_delta

                FROM propiedades pp
                            
                INNER JOIN producto_propiedades rel
                  ON rel.propiedad_id = pp.id
                            
                WHERE rel.producto_id = ?
                            
                ORDER BY pp.nombre ASC
                `,
                [productoId],
            );

        return rows;

    } finally {
        conn.release();
    }
}