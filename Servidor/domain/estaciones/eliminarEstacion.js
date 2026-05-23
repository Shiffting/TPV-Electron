import { pool } from "../../src/db/pool.js";

export async function eliminarEstacion({
    estacionId,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // DESACTIVAR
        // =====================================

        await conn.execute(
            `
            UPDATE estaciones
            SET activa = 0
            WHERE id = ?
            `,
            [estacionId],
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