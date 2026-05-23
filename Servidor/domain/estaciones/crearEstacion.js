import { pool } from "../../src/db/pool.js";

export async function crearEstacion({
    nombre,
    color = null,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // INSERT ESTACIÓN
        // =====================================

        const [insertada] = await conn.execute(
            `
            INSERT INTO estaciones
            (
              nombre,
              color,
              activa
            )
            VALUES (?, ?, 1)
            `,
            [
                nombre,
                color,
            ],
        );

        await conn.commit();

        return {
            ok: true,
            estacionId: insertada.insertId,
        };
    } catch (e) {
        await conn.rollback();

        throw e;
    } finally {
        conn.release();
    }
}