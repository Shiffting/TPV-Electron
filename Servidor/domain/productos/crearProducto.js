import { pool } from "../../src/db/pool.js";

export async function crearProducto({
    nombre,
    precio,
    categoriaId = null,
    estacionId = null,
    imagen = null,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // INSERT PRODUCTO
        // =====================================

        const [insertado] = await conn.execute(
            `
            INSERT INTO productos
            (
              nombre,
              precio,
              categoria_id,
              estacion_id,
              imagen,
              activo
            )
            VALUES (?, ?, ?, ?, ?, 1)
            `,
            [
                nombre,
                precio,
                categoriaId,
                estacionId,
                imagen,
            ],
        );

        await conn.commit();

        return {
            ok: true,
            productoId: insertado.insertId,
        };
    } catch (e) {
        await conn.rollback();

        throw e;
    } finally {
        conn.release();
    }
}