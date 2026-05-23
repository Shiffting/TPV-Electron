import { pool } from "../../src/db/pool.js";

export async function eliminarCategoria({
    categoriaId,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // DESACTIVAR
        // =====================================

        await conn.execute(
            `
            UPDATE categorias
            SET activa = 0
            WHERE id = ?
            `,
            [categoriaId],
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