import { pool } from "../../src/db/pool.js";

export async function crearCategoria({
    nombre,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // INSERT CATEGORÍA
        // =====================================

        const [insertada] = await conn.execute(
            `
            INSERT INTO categorias
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
            categoriaId: insertada.insertId,
        };
    } catch (e) {
        await conn.rollback();

        throw e;
    } finally {
        conn.release();
    }
}