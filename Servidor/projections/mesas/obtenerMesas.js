import { pool } from "../../src/db/pool.js";

export async function obtenerMesas() {

    const [mesas] = await pool.query(`
        SELECT
            m.id,
            m.nombre,

            s.nombre AS sala_nombre,

            t.id AS ticket_id,
            t.total_bruto,
            t.estatus_financiero,
            t.comensales,
            t.creado_en,

            TIMESTAMPDIFF(
                MINUTE,
                t.creado_en,
                NOW()
            ) AS minutos_ocupada,

            COUNT(
                CASE
                    WHEN tl.lifecycle_status = 'activo'
                    AND tl.estatus_operacional != 'servido'
                    THEN 1
                END
            ) AS items_pendientes

        FROM mesas m

        LEFT JOIN salas s
            ON s.id = m.sala_id

        LEFT JOIN tickets t
            ON t.id = (
                SELECT tt.id
                FROM tickets tt
                WHERE tt.mesa_id = m.id
                AND tt.cerrado_en IS NULL
                ORDER BY tt.id DESC
                LIMIT 1
            )

        LEFT JOIN ticket_lineas tl
            ON tl.ticket_id = t.id
            AND tl.lifecycle_status = 'activo'

        WHERE m.activa = 1

        GROUP BY
            m.id,
            m.nombre,
            s.nombre,
            t.id,
            t.total_bruto,
            t.estatus_financiero,
            t.comensales,
            t.creado_en

        ORDER BY m.nombre ASC
    `);

    return mesas.map((m) => {

        const ocupada = !!m.ticket_id;

        let estado = "libre";

        if (ocupada) {
            if (m.estatus_financiero === "pagado") {
                estado = "pagada";
            } else if (Number(m.items_pendientes || 0) > 0) {
                estado = "pendiente";
            } else {
                estado = "ocupada";
            }
        }

        return {
            id: m.id,

            nombre: m.nombre,

            sala: {
                nombre: m.sala_nombre || "Sala",
            },

            ocupacion: {
                ocupada,
                estado,
                minutos:
                    ocupada
                        ? Number(m.minutos_ocupada || 0)
                        : 0,
            },

            ticket: ocupada
                ? {
                    id: m.ticket_id,

                    total_bruto: Number(
                        m.total_bruto || 0
                    ),

                    estado_financiero:
                        m.estatus_financiero,

                    comensales:
                        Number(
                            m.comensales || 1
                        ),

                    items_pendientes:
                        Number(
                            m.items_pendientes || 0
                        ),
                }
                : null,
        };
    });
}