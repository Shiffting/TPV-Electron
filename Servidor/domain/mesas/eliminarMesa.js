import { pool } from "../../src/db/pool.js";

export async function eliminarMesa({
    mesaId,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // DESACTIVAR
        // =====================================

        await conn.execute(
            `
            UPDATE mesas
            SET activa = 0
            WHERE id = ?
            `,
            [mesaId],
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