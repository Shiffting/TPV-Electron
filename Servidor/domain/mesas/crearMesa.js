import { pool } from "../../src/db/pool.js";

export async function crearMesa({
    nombre,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // INSERT MESA
        // =====================================

        const [insertada] = await conn.execute(
            `
            INSERT INTO mesas
            (
              nombre,
              activa
            )
            VALUES (?, 1)
            `,
            [nombre],
        );

        await conn.commit();

        return {
            ok: true,
            mesaId: insertada.insertId,
        };
    } catch (e) {
        await conn.rollback();

        throw e;
    } finally {
        conn.release();
    }
}