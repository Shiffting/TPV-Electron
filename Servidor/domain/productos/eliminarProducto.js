import { pool } from "../../src/db/pool.js";

export async function eliminarProducto({
    productoId,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // DESACTIVAR
        // =====================================

        await conn.execute(
            `
            UPDATE productos
            SET activo = 0
            WHERE id = ?
            `,
            [productoId],
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