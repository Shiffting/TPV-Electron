import { pool } from "../../src/db/pool.js";

export async function editarMesa({
    mesaId,
    cambios,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // MESA ACTUAL
        // =====================================

        const [[mesaActual]] = await conn.query(
            `
            SELECT *
            FROM mesas
            WHERE id = ?
            LIMIT 1
            `,
            [mesaId],
        );

        if (!mesaActual) {
            throw new Error("MESA_NO_ENCONTRADA");
        }

        // =====================================
        // MESA FINAL
        // =====================================

        const mesaFinal = {
            ...mesaActual,
            ...cambios,
        };

        // =====================================
        // UPDATE
        // =====================================

        await conn.execute(
            `
            UPDATE mesas
            SET
              nombre = ?
            WHERE id = ?
            `,
            [
                mesaFinal.nombre,
                mesaId,
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