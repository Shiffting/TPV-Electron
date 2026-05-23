import { pool } from "../../src/db/pool.js";

export async function obtenerTicket({
    ticketId,
}) {
    // =====================================
    // TICKET
    // =====================================

    const [[ticket]] = await pool.query(
        `
        SELECT
        t.*,

        m.nombre AS mesa_nombre

        FROM tickets t

        LEFT JOIN mesas m
            ON m.id = t.mesa_id

        WHERE t.id = ?
        LIMIT 1
        `,
        [ticketId],
    );

    if (!ticket) {
        throw new Error("TICKET_NO_ENCONTRADO");
    }

    // =====================================
    // LÍNEAS ACTIVAS
    // =====================================

    const [lineas] = await pool.query(
        `
        SELECT *
        FROM ticket_lineas
            
        WHERE ticket_id = ?
          AND lifecycle_status = 'activo'
          AND estatus_operacional != 'cancelado'
            
        ORDER BY id ASC
        `,
        [ticketId],
    );

    // =====================================
    // PROPIEDADES
    // =====================================

    const lineasIds =
        lineas.map((l) => l.id);

    let propiedades = [];

    if (lineasIds.length > 0) {
        const [rows] = await pool.query(
            `
        SELECT

        tlp.*,
        p.nombre

        FROM ticket_linea_propiedades tlp

        LEFT JOIN propiedades p
            ON p.id = tlp.propiedad_id

        WHERE tlp.ticket_linea_id IN (?)
        `,
            [lineasIds],
        );

        propiedades = rows;
    }

    // =====================================
    // PROPIEDADES POR LÍNEA
    // =====================================

    const propsPorLinea = {};

    for (const prop of propiedades) {
        if (!propsPorLinea[prop.ticket_linea_id]) {
            propsPorLinea[prop.ticket_linea_id] = [];
        }

        propsPorLinea[prop.ticket_linea_id]
            .push(prop);
    }

    // =====================================
    // PAGOS
    // =====================================

    const [pagos] = await pool.query(
        `
        SELECT *
        FROM pagos
        WHERE ticket_id = ?
        ORDER BY id ASC
        `,
        [ticketId],
    );

    // =====================================
    // RESPUESTA
    // =====================================
    console.log(
        lineas.map(l => ({
            id: l.id,
            nombre: l.nombre_producto,
            lifecycle: l.lifecycle_status,
        }))
    );
    return {
        ticket: {
            id: ticket.id,
            mesaId: ticket.mesa_id,
            total: Number(ticket.total_bruto || 0),
            estadoFinanciero: ticket.estatus_financiero,
            version: ticket.version,
            createdAt: ticket.creado_en,
            closedAt: ticket.cerrado_en,
            mesaNombre: ticket.mesa_nombre,
        },

        lineas: lineas.map((l) => ({
            id: l.id,
            productoId: l.producto_id,
            nombreProducto: l.nombre_producto,
            cantidad: l.cantidad,
            precioUnitario:
                Number(
                    l.precio_unitario,
                ),
            subTotal:
                Number(
                    l.total_linea,
                ),
            estadoFinanciero: l.estatus_financiero,
            estadoOperacional: l.estatus_operacional,
            propiedades: propsPorLinea[l.id] || [],
        })),
        pagos,
    };
}