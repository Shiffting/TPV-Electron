import { pool } from "../../src/db/pool.js";

export async function editarProducto({
    productoId,
    cambios,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // PRODUCTO ACTUAL
        // =====================================

        const [[productoActual]] = await conn.query(
            `
            SELECT *
            FROM productos
            WHERE id = ?
            LIMIT 1
            `,
            [productoId],
        );

        if (!productoActual) {
            throw new Error("PRODUCTO_NO_ENCONTRADO");
        }

        // =====================================
        // PRODUCTO FINAL
        // =====================================

        const productoFinal = {
            ...productoActual,
            ...cambios,
        };

        // =====================================
        // UPDATE
        // =====================================

        await conn.execute(
            `
            UPDATE productos
            SET
              nombre = ?,
              precio = ?,
              categoria_id = ?,
              estacion_id = ?,
              imagen = ?
            WHERE id = ?
            `,
            [
                productoFinal.nombre,
                productoFinal.precio,
                productoFinal.categoria_id,
                productoFinal.estacion_id,
                productoFinal.imagen,
                productoId,
            ],
        );

        await conn.commit();

        return {
            ok: true,
        };
    } catch (e) {
        await conn.rollback();

        throw e;
    } finally {
        conn.release();
    }
}