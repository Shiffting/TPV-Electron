import { pool } from "../../src/db/pool.js";

export async function obtenerEstaciones() {

    // =====================================
    // ESTACIONES
    // =====================================

    const [estaciones] =
        await pool.query(
            `
            SELECT
                id,
                nombre,
                color,
                orden
            FROM estaciones
            WHERE activa = 1
            ORDER BY orden ASC, nombre ASC
            `,
        );

    // =====================================
    // LÍNEAS ACTIVAS
    // =====================================

    const [lineas] =
        await pool.query(
            `
            SELECT
                tl.id,
                tl.ticket_id,
                tl.cantidad,
                tl.estatus_operacional,
                tl.estatus_operacional_updated_at,
                    
                p.nombre AS producto_nombre,
                    
                e.id AS estacion_id,
                e.nombre AS estacion_nombre,
                e.color AS estacion_color,
                    
                m.id AS mesa_id
                    
            FROM ticket_lineas tl
                    
            INNER JOIN productos p
                ON p.id = tl.producto_id
                    
            INNER JOIN estaciones e
                ON e.id = p.estacion_id
                    
            INNER JOIN tickets t
                ON t.id = tl.ticket_id
                    
            LEFT JOIN mesas m
                ON m.id = t.mesa_id
                    
            WHERE
                tl.lifecycle_status = 'activo'
                    
                AND tl.estatus_financiero != 'pagado'
                    
                AND tl.estatus_operacional IN (
                    'enviado',
                    'preparando',
                    'listo'
                )
                    
            ORDER BY
                tl.id ASC
            `,
        );

    const [props] =
        await pool.query(
            `
        SELECT
            tlp.ticket_linea_id,
            p.nombre

        FROM ticket_linea_propiedades tlp

        INNER JOIN propiedades p
            ON p.id = tlp.propiedad_id
        `,
        );

    // =====================================
    // MAP
    // =====================================

    return estaciones.map(
        (estacion) => ({

            id: estacion.id,
            nombre: estacion.nombre,
            color: estacion.color,
            lineas:
                lineas
                    .filter(
                        (l) =>
                            l.estacion_id ===
                            estacion.id,
                    )
                    .map(
                        (l) => ({

                            id: l.id,
                            ticketId: l.ticket_id,
                            cantidad:
                                Number(
                                    l.cantidad,
                                ),
                            estadoOperativo: l.estatus_operacional,
                            actualizadoEn: l.estatus_operacional_updated_at,
                            nombreProducto: l.producto_nombre,
                            mesaId: l.mesa_id,
                            estacionId: l.estacion_id,
                            estacionNombre: l.estacion_nombre,
                            estacionColor: l.estacion_color,
                            propiedades:
                                props
                                    .filter(
                                        (p) =>
                                            p.ticket_linea_id ===
                                            l.id,
                                    )
                                    .map(
                                        (p) => p.nombre,
                                    ),
                        }),
                    )
        }),
    );
}