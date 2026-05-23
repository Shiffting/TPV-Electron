import { pool } from "../../src/db/pool.js";

export async function editarEstacion({
    estacionId,
    cambios,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // ESTACIÓN ACTUAL
        // =====================================

        const [[estacionActual]] = await conn.query(
            `
            SELECT *
            FROM estaciones
            WHERE id = ?
            LIMIT 1
            `,
            [estacionId],
        );

        if (!estacionActual) {
            throw new Error("ESTACION_NO_ENCONTRADA");
        }

        // =====================================
        // ESTACIÓN FINAL
        // =====================================

        const estacionFinal = {
            ...estacionActual,
            ...cambios,
        };

        // =====================================
        // UPDATE
        // =====================================

        await conn.execute(
            `
            UPDATE estaciones
            SET
              nombre = ?,
              color = ?
            WHERE id = ?
            `,
            [
                estacionFinal.nombre,
                estacionFinal.color,
                estacionId,
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