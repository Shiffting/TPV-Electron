import { pool } from "../../src/db/pool.js";

export async function editarCategoria({
    categoriaId,
    cambios,
}) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // =====================================
        // CATEGORÍA ACTUAL
        // =====================================

        const [[categoriaActual]] = await conn.query(
            `
            SELECT *
            FROM categorias
            WHERE id = ?
            LIMIT 1
            `,
            [categoriaId],
        );

        if (!categoriaActual) {
            throw new Error("CATEGORIA_NO_ENCONTRADA");
        }

        // =====================================
        // CATEGORÍA FINAL
        // =====================================

        const categoriaFinal = {
            ...categoriaActual,
            ...cambios,
        };

        // =====================================
        // UPDATE
        // =====================================

        await conn.execute(
            `
            UPDATE categorias
            SET
              nombre = ?
            WHERE id = ?
            `,
            [
                categoriaFinal.nombre,
                categoriaId,
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