import { pool } from "../../src/db/pool.js";

export async function obtenerTickets() {
    // =====================================
    // TICKETS
    // =====================================

    const [tickets] = await pool.query(
        `
        SELECT
          t.id,
          t.mesa_id,
          t.total_bruto,
          t.estatus_financiero,
          t.version,
          t.creado_en,
          t.cerrado_en,

          m.nombre AS mesa_nombre

        FROM tickets t

        LEFT JOIN mesas m
          ON m.id = t.mesa_id

        ORDER BY t.id DESC
        `,
    );

    // =====================================
    // RESPUESTA
    // =====================================

    return tickets.map((t) => ({
        id: t.id,

        mesaId: t.mesa_id,
        mesaNombre: t.mesa_nombre,

        total: Number(t.total),

        estadoFinanciero:
            t.estatus_financiero,

        version: t.version,

        creadoEn: t.creado_en,
        cerradoEn: t.cerrado_en,
    }));
}