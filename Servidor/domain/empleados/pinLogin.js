import { pool } from "../../src/db/pool.js";

export async function pinLogin(
    req,
    res,
) {
    try {
        const { pin } = req.body;

        if (!pin) {
            return res.status(400).json({
                error: "PIN requerido",
            });
        }

        const [rows] =
            await pool.query(
                `
                SELECT
                  id,
                  nombre,
                  rol
                FROM empleados
                WHERE pin = ?
                AND activo = 1
                LIMIT 1
                `,
                [pin],
            );

        const empleado = rows[0];

        if (!empleado) {
            return res.status(401).json({
                error: "PIN incorrecto",
            });
        }

        // =====================================
        // AUTO FICHAJE
        // =====================================

        const [sesiones] =
            await pool.query(
                `
                SELECT id
                FROM empleado_sesiones
                WHERE empleado_id = ?
                AND finalizada_en IS NULL
                LIMIT 1
                `,
                [empleado.id],
            );

        if (sesiones.length === 0) {
            await pool.query(
                `
                INSERT INTO empleado_sesiones (
                  empleado_id
                )
                VALUES (?)
                `,
                [empleado.id],
            );
        }

        return res.json({
            empleado: {
                id: empleado.id,
                nombre: empleado.nombre,
                rol: empleado.rol,
            },
        });
    } catch (e) {
        console.error(e);

        return res.status(500).json({
            error: "Error interno",
        });
    }
}