import { pool } from "../../src/db/pool.js";

export async function obtenerDashboard() {
    const conn = await pool.getConnection();

    try {

        // =====================================
        // VENTAS HOY
        // =====================================

        const [[ventasHoy]] = await conn.query(
            `
            SELECT
              COALESCE(SUM(total_bruto), 0) AS ventas,
              COUNT(*) AS tickets
            FROM tickets
            WHERE
              estatus_financiero = 'pagado'
              AND DATE(cerrado_en) = CURDATE()
            `,
        );

        const ventas =
            Number(ventasHoy.ventas || 0);

        const tickets =
            Number(ventasHoy.tickets || 0);

        const ticketMedio =
            tickets > 0
                ? ventas / tickets
                : 0;

        // =====================================
        // TOP PRODUCTOS
        // =====================================

        const [topProductos] = await conn.query(
            `
            SELECT
              nombre_producto AS nombre,
              SUM(cantidad) AS cantidad
            FROM ticket_lineas
            WHERE lifecycle_status = 'activo'
            GROUP BY nombre_producto
            ORDER BY cantidad DESC
            LIMIT 10
            `,
        );

        return {
            hoy: {
                ventas,
                tickets,
                ticketMedio,
            },

            topProductos,
        };

    } finally {
        conn.release();
    }
}