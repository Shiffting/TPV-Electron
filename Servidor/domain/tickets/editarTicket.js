import { pool } from "../../src/db/pool.js";

import { cargarTicket } from "../helpers/cargarTicket.js";
import { validarVersionTicket } from "../helpers/validarVersionTicket.js";

export async function editarTicket({
    ticketId,
    accion,
    payload,
    versionEsperada,
    usuarioId,
}) {
    const conn = await pool.getConnection();

    try {
        // EMPEZAMOS TRANSACCIÓN
        await conn.beginTransaction();

        // CARGAMOS TICKET
        const ticket = await cargarTicket({
            conn,
            ticketId,
        });

        // VALIDAMOS CONCURRENCIA
        validarVersionTicket({
            versionActual: ticket.version,
            versionEsperada,
        });

        // ACCIONES
        switch (accion) {
            case "agregar_linea":

                // DATOS
                const {
                    productoId,
                    cantidad,
                    propiedades = [],
                } = payload;

                // PRODUCTO
                const [[producto]] = await conn.query(
                    `
                    SELECT *
                    FROM productos
                    WHERE id = ?
                      AND activo = 1
                    LIMIT 1
                    `,
                    [productoId],
                );

                if (!producto) {
                    throw new Error("PRODUCTO_NO_ENCONTRADO");
                }

                // =====================================
                // PRECIO FINAL
                // =====================================

                const extras = propiedades.reduce(
                    (acc, prop) => acc + Number(prop.precioDelta || 0),
                    0,
                );

                const precioUnitario = Number(producto.precio) + extras;
                const totalLinea = precioUnitario * cantidad;

                // CONFIG HASH
                const configHash = [
                    productoId,
                    ...propiedades
                        .map((p) => p.propiedadId)
                        .sort((a, b) => a - b),
                ].join("|");

                // =====================================
                // NUEVA LÍNEA
                // =====================================

                const [insertada] = await conn.execute(
                    `
                    INSERT INTO ticket_lineas
                    (
                      ticket_id,

                      producto_id,
                      nombre_producto,

                      cantidad,

                      precio_unitario,
                      precio_base,

                      total_linea,

                      estado_financiero,
                      estado_operacional,
                      estado_snapshot,

                      config_hash
                    )
                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        ticketId,

                        producto.id,
                        producto.nombre,

                        cantidad,

                        precioUnitario,
                        producto.precio,

                        totalLinea,

                        "sin_pagar",
                        "pendiente",
                        "activo",

                        configHash,
                    ],
                );

                const lineaId = insertada.insertId;

                // =====================================
                // PROPIEDADES
                // =====================================

                for (const prop of propiedades) {
                    await conn.execute(
                        `
                        INSERT INTO ticket_linea_propiedades
                        (
                          ticket_linea_id,
                          propiedad_id,
                          precio_delta
                        )
                        VALUES (?, ?, ?)
                        `,
                        [
                            lineaId,
                            prop.propiedadId,
                            prop.precioDelta || 0,
                        ],
                    );
                }

                // RECALCULAR TOTALES
                await recalcularTotalesTicket({
                    conn,
                    ticketId,
                });

                // NUEVA VERSIÓN
                const nuevaVersion =
                    await incrementarVersionTicket({
                        conn,
                        ticketId,
                    });

                // ACCIÓN
                await adjuntarAccionATicket({
                    conn,
                    ticketId,
                    tipoAccion: "LINEA_AGREGADA",
                    usuarioId,
                    version: nuevaVersion,
                    payload: {
                        lineaId,
                        productoId,
                        cantidad,
                    },
                });
                break;

            case "editar_linea":

                // DATOS
                const {
                    lineaId,
                    cantidad,
                    propiedades = [],
                } = payload;

                const lineaOriginal =
                    await cargarLineaTicket({
                        conn,
                        lineaId,
                    });

                validarLineaEditable(lineaOriginal);

                // =====================================
                // NUEVO PRECIO
                // =====================================

                const extras = propiedades.reduce(
                    (acc, prop) => acc + Number(prop.precioDelta || 0),
                    0,
                );

                const precioUnitario = Number(lineaOriginal.precio_base) + extras;
                const nuevaCantidad = cantidad ?? lineaOriginal.cantidad;
                const totalLinea = precioUnitario * nuevaCantidad;

                // CONFIG HASH
                const configHash = [
                    lineaOriginal.producto_id,
                    ...propiedades
                        .map((p) => p.propiedadId)
                        .sort((a, b) => a - b),
                ].join("|");

                // SNAPSHOT NUEVO
                const nuevaLineaId =
                    await crearSnapshotLinea({
                        conn,
                        lineaOriginal,
                        cambios: {
                            cantidad: nuevaCantidad,
                            precio_unitario: precioUnitario,
                            total_linea: totalLinea,
                            config_hash: configHash,
                        },
                    });

                // =====================================
                // PROPIEDADES NUEVAS
                // =====================================

                for (const prop of propiedades) {
                    await conn.execute(
                        `
                        INSERT INTO ticket_linea_propiedades
                        (
                          ticket_linea_id,
                          propiedad_id,
                          precio_delta
                        )
                        VALUES (?, ?, ?)
                        `,
                        [
                            nuevaLineaId,
                            prop.propiedadId,
                            prop.precioDelta || 0,
                        ],
                    );
                }

                // RECALCULAR TOTALES
                await recalcularTotalesTicket({
                    conn,
                    ticketId,
                });

                // NUEVA VERSIÓN
                const nuevaVersion =
                    await incrementarVersionTicket({
                        conn,
                        ticketId,
                    });

                // ACCIÓN
                await adjuntarAccionATicket({
                    conn,
                    ticketId,
                    tipoAccion: "LINEA_EDITADA",
                    usuarioId,
                    version: nuevaVersion,
                    payload: {
                        lineaOriginalId: lineaOriginal.id,
                        nuevaLineaId,
                    },
                });
                break;

            case "eliminar_linea":

                // DATOS
                const {
                    lineaId,
                } = payload;

                const lineaOriginal =
                    await cargarLineaTicket({
                        conn,
                        lineaId,
                    });

                validarLineaEditable(lineaOriginal);

                // SNAPSHOT CANCELADO
                const nuevaLineaId =
                    await crearSnapshotLinea({
                        conn,
                        lineaOriginal,
                        cambios: {
                            estado_operacional: "cancelado",
                        },
                    });

                // RECALCULAR
                await recalcularTotalesTicket({
                    conn,
                    ticketId,
                });

                // NUEVA VERSIÓN
                const nuevaVersion =
                    await incrementarVersionTicket({
                        conn,
                        ticketId,
                    });

                // ACCIÓN
                await adjuntarAccionATicket({
                    conn,
                    ticketId,
                    tipoAccion: "LINEA_CANCELADA",
                    usuarioId,
                    version: nuevaVersion,
                    payload: {
                        lineaOriginalId: lineaOriginal.id,
                        nuevaLineaId,
                    },
                });

                break;

            case "enviar_cocina":

                // LÍNEAS PENDIENTES
                const [lineas] = await conn.query(
                    `
                    SELECT *
                    FROM ticket_lineas
                    WHERE ticket_id = ?
                      AND estado_snapshot = 'activo'
                      AND estado_operacional = 'pendiente'
                    `,
                    [ticketId],
                );

                // ENVIAR
                for (const linea of lineas) {
                    await conn.execute(
                        `
                        UPDATE ticket_lineas
                        SET estado_operacional = 'enviado'
                        WHERE id = ?
                        `,
                        [linea.id],
                    );
                }

                // NUEVA VERSIÓN
                const nuevaVersion =
                    await incrementarVersionTicket({
                        conn,
                        ticketId,
                    });

                // ACCIÓN
                await adjuntarAccionATicket({
                    conn,
                    ticketId,
                    tipoAccion: "TICKET_ENVIADO_COCINA",
                    usuarioId,
                    version: nuevaVersion,
                    payload: {
                        lineas: lineas.map((l) => l.id),
                    },
                });
                break;

            case "agregar_pago":

                // DATOS
                const {
                    metodoPagoId,
                    importe,
                } = payload;

                // INSERT PAGO
                await conn.execute(
                    `
                    INSERT INTO pagos
                    (
                      ticket_id,
                      metodo_pago_id,
                      importe
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        ticketId,
                        metodoPagoId,
                        importe,
                    ],
                );

                // =====================================
                // TOTAL PAGADO
                // =====================================

                const [[pagos]] = await conn.query(
                    `
                    SELECT
                      COALESCE(SUM(importe), 0) AS total
                    FROM pagos
                    WHERE ticket_id = ?
                    `,
                    [ticketId],
                );

                const totalPagado = Number(pagos.total);

                // =====================================
                // TOTAL TICKET
                // =====================================

                const [[ticketActual]] = await conn.query(
                    `
                    SELECT total
                    FROM tickets
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [ticketId],
                );

                // =====================================
                // NUEVO ESTADO
                // =====================================

                let estadoFinanciero = "sin_pagar";

                if (totalPagado > 0) {
                    estadoFinanciero = "parcial";
                }

                if (totalPagado >= Number(ticketActual.total)) {
                    estadoFinanciero = "pagado";
                }

                // =====================================
                // UPDATE TICKET
                // =====================================

                await conn.execute(
                    `
                    UPDATE tickets
                    SET estado_financiero = ?
                    WHERE id = ?
                    `,
                    [
                        estadoFinanciero,
                        ticketId,
                    ],
                );

                // NUEVA VERSIÓN
                const nuevaVersion =
                    await incrementarVersionTicket({
                        conn,
                        ticketId,
                    });

                // ACCIÓN
                await adjuntarAccionATicket({
                    conn,
                    ticketId,
                    tipoAccion: "PAGO_AGREGADO",
                    usuarioId,
                    version: nuevaVersion,
                    payload: {
                        metodoPagoId,
                        importe,
                    },
                });
                break;

            case "cerrar_ticket":

                // RECARGAR TICKET
                const ticketActual =
                    await cargarTicket({
                        conn,
                        ticketId,
                    });

                // VALIDAR PAGADO
                if (ticketActual.estado_financiero !== "pagado") {
                    throw new Error("TICKET_NO_PAGADO");
                }

                // =====================================
                // MARCAR CERRADO
                // =====================================

                await conn.execute(
                    `
                    UPDATE tickets
                    SET cerrado_en = NOW()
                    WHERE id = ?
                    `,
                    [ticketId],
                );

                // NUEVA VERSIÓN
                const nuevaVersion =
                    await incrementarVersionTicket({
                        conn,
                        ticketId,
                    });

                // ACCIÓN
                await adjuntarAccionATicket({
                    conn,
                    ticketId,
                    tipoAccion: "TICKET_CERRADO",
                    usuarioId,
                    version: nuevaVersion,
                    payload: {},
                });
                break;

            default:
                throw new Error("ACCION_INVALIDA");
        }

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