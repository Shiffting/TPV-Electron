import { pool } from "../../src/db/pool.js";

import { cargarTicket } from "../helpers/cargarTicket.js";
import { validarVersionTicket } from "../helpers/validarVersionTicket.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { recalcularTotalesTicket } from "../helpers/recalcularTotalesTicket.js";
import { incrementarVersionTicket } from "../helpers/incrementarVersionTicket.js";
import { cargarLineaTicket } from "../helpers/cargarLineaTicket.js";
import { validarLineaEditable } from "../helpers/validarLineaEditable.js";
import { crearSnapshotLinea } from "../helpers/crearSnapshotLinea.js";
import { io } from "../../src/app.js";
import { recalcularEstadoFinancieroTicket } from "../helpers/recalcularEstadoFinancieroTicket.js";

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

        const empleadoId = payload.empleadoId

        // ACCIONES
        switch (accion) {
            case "agregar_linea": {
                validarVersionTicket({
                    versionActual: ticket.version,
                    versionEsperada,
                });
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
                const subTotal = precioUnitario * cantidad;

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

                      estatus_financiero,
                      estatus_operacional,
                      lifecycle_status,

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

                        subTotal,

                        "pendiente",
                        "pendiente",
                        "activo",

                        configHash,
                    ],
                );

                const nuevaLineaId = insertada.insertId;

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

                await recalcularEstadoFinancieroTicket({
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
                await adjuntarAccionDeTicket({
                    conn,
                    ticketId,
                    tipoAccion: "LINEA_AGREGADA",
                    usuarioId,
                    aggregateVersion: nuevaVersion,
                    payload: {
                        nuevaLineaId,
                        productoId,
                        cantidad,
                        empleadoId
                    },
                });
                break;
            }

            case "editar_linea": {
                validarVersionTicket({
                    versionActual: ticket.version,
                    versionEsperada,
                });

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
                const subTotal = precioUnitario * nuevaCantidad;

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
                            total_linea: subTotal,
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

                await recalcularEstadoFinancieroTicket({
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
                await adjuntarAccionDeTicket({
                    conn,
                    ticketId,
                    tipoAccion: "LINEA_EDITADA",
                    usuarioId,
                    aggregateVersion: nuevaVersion,
                    payload: {
                        lineaOriginalId: lineaOriginal.id,
                        nuevaLineaId,
                        empleadoId
                    },
                });
                break;
            }

            case "eliminar_linea": {
                validarVersionTicket({
                    versionActual: ticket.version,
                    versionEsperada,
                });

                // DATOS
                const { lineaId } = payload;

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
                            estatus_operacional: "cancelado",
                        },
                    });

                // RECALCULAR
                await recalcularTotalesTicket({
                    conn,
                    ticketId,
                });

                await recalcularEstadoFinancieroTicket({
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
                await adjuntarAccionDeTicket({
                    conn,
                    ticketId,
                    tipoAccion: "LINEA_CANCELADA",
                    usuarioId,
                    aggregateVersion: nuevaVersion,
                    payload: {
                        lineaOriginalId: lineaOriginal.id,
                        nuevaLineaId,
                        empleadoId
                    },
                });

                break;
            }

            case "enviar_cocina": {
                validarVersionTicket({
                    versionActual: ticket.version,
                    versionEsperada,
                });

                // LÍNEAS PENDIENTES
                const [lineas] = await conn.query(
                    `
                    SELECT *
                    FROM ticket_lineas
                    WHERE ticket_id = ?
                      AND lifecycle_status = 'activo'
                      AND estatus_operacional = 'pendiente'
                    `,
                    [ticketId],
                );

                // ENVIAR
                for (const linea of lineas) {
                    await conn.execute(
                        `
                        UPDATE ticket_lineas
                        SET
                            estatus_operacional = 'enviado',
                            estatus_operacional_updated_at = NOW()
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
                await adjuntarAccionDeTicket({
                    conn,
                    ticketId,
                    tipoAccion: "TICKET_ENVIADO_COCINA",
                    usuarioId,
                    aggregateVersion: nuevaVersion,
                    payload: {
                        lineas: lineas.map((l) => l.id),
                        empleadoId
                    },
                });
                break;
            }

            case "agregar_pago": {
                validarVersionTicket({
                    versionActual: ticket.version,
                    versionEsperada,
                });

                // =====================================
                // DATOS
                // =====================================

                const {
                    metodoPagoId,
                    importe,
                    lineas = [],
                } = payload;

                // =====================================
                // INSERT PAGO
                // =====================================

                const [insertPago] =
                    await conn.execute(
                        `
                        INSERT INTO pagos
                        (
                            ticket_id,
                            metodo_id,
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

                const pagoId =
                    insertPago.insertId;

                // =====================================
                // ALLOCATIONS
                // =====================================

                for (const linea of lineas) {
                    await conn.execute(
                        `
                        INSERT INTO
                        payment_allocations
                        (
                            pago_id,
                            ticket_linea_id,
                            importe
                        )
                        VALUES (?, ?, ?)
                        `,
                        [
                            pagoId,
                            linea.lineaId,
                            linea.importe,
                        ],
                    );
                }

                // =====================================
                // RECALCULAR LÍNEAS
                // =====================================

                const [lineasTicket] =
                    await conn.query(
                        `
                        SELECT
                            id,
                            total_linea
                        FROM ticket_lineas
                        WHERE ticket_id = ?
                          AND lifecycle_status = 'activo'
                          AND estatus_operacional != 'cancelado'
                        `,
                        [ticketId],
                    );

                for (const linea of lineasTicket) {

                    const [[alloc]] =
                        await conn.query(
                            `
                            SELECT
                                COALESCE(
                                    SUM(importe),
                                    0
                                ) AS total
                            FROM payment_allocations
                            WHERE ticket_linea_id = ?
                            `,
                            [linea.id],
                        );

                    const pagado =
                        Number(alloc.total);

                    const totalLinea =
                        Number(linea.total_linea);

                    let estado =
                        "pendiente";

                    if (pagado > 0) {
                        estado = "parcial";
                    }

                    if (pagado >= totalLinea) {
                        estado = "pagado";
                    }

                    await conn.execute(
                        `
                        UPDATE ticket_lineas
                        SET estatus_financiero = ?
                        WHERE id = ?
                        `,
                        [
                            estado,
                            linea.id,
                        ],
                    );
                }

                // =====================================
                // RECALCULAR TICKET
                // =====================================

                await recalcularEstadoFinancieroTicket({
                    conn,
                    ticketId,
                });

                // =====================================
                // NUEVA VERSIÓN
                // =====================================

                const nuevaVersion =
                    await incrementarVersionTicket({
                        conn,
                        ticketId,
                    });

                // =====================================
                // ACCIÓN
                // =====================================

                await adjuntarAccionDeTicket({
                    conn,
                    ticketId,
                    tipoAccion: "PAGO_AGREGADO",
                    usuarioId,
                    aggregateVersion: nuevaVersion,
                    payload: {
                        metodoPagoId,
                        importe,
                        empleadoId
                    },
                });

                break;
            }

            case "cerrar_ticket": {
                validarVersionTicket({
                    versionActual: ticket.version,
                    versionEsperada,
                });

                // RECARGAR TICKET
                const ticketActual =
                    await cargarTicket({
                        conn,
                        ticketId,
                    });

                // VALIDAR PAGADO
                if (ticketActual.estatus_financiero !== "pagado") {
                    throw new Error("TICKET_NO_PAGADO");
                }

                // =====================================
                // MARCAR CERRADO
                // =====================================

                // NUEVA VERSIÓN
                const nuevaVersion =
                    await incrementarVersionTicket({
                        conn,
                        ticketId,
                    });

                await conn.execute(
                    `
                    UPDATE tickets
                    SET cerrado_en = NOW()
                    WHERE id = ?
                    AND cerrado_en IS NULL
                    `,
                    [ticketId],
                );

                // ACCIÓN
                await adjuntarAccionDeTicket({
                    conn,
                    ticketId,
                    tipoAccion: "TICKET_CERRADO",
                    usuarioId,
                    aggregateVersion: nuevaVersion,
                    payload: {
                        empleadoId
                    },
                });
                break;
            }

            case "actualizar_comensales": {

                const {
                    comensales,
                } = payload;

                if (
                    !Number.isInteger(comensales) ||
                    comensales < 1
                ) {
                    throw new Error(
                        "COMENSALES_INVALIDOS",
                    );
                }

                await conn.execute(
                    `
                    UPDATE tickets
                    SET comensales = ?
                    WHERE id = ?
                    `,
                    [
                        comensales,
                        ticketId,
                    ],
                );

                const nuevaVersion =
                    await incrementarVersionTicket({
                        conn,
                        ticketId,
                    });

                await adjuntarAccionDeTicket({
                    conn,
                    ticketId,
                    tipoAccion:
                        "COMENSALES_ACTUALIZADOS",
                    usuarioId,
                    aggregateVersion: nuevaVersion,
                    payload: {
                        comensales,
                        empleadoId
                    },
                });

                break;
            }

            case "cambiar_estado_lineas": {

                const {
                    lineasIds,
                    estado,
                } = payload;

                await conn.query(
                    `
                    UPDATE ticket_lineas
                    SET
                        estatus_operacional = ?,
                        estatus_operacional_updated_at = NOW()
                    WHERE id IN (?)
                    `,
                    [
                        estado,
                        lineasIds,
                    ],
                );

                await adjuntarAccionDeTicket({
                    conn,
                    ticketId,

                    tipoAccion:
                        "LINEAS_ESTADO_CAMBIADO",

                    usuarioId,

                    version:
                        ticket.version,

                    payload: {
                        lineasIds,
                        estado,
                        empleadoId
                    },
                });

                break;
            }

            default:
                throw new Error("ACCION_INVALIDA");
        }

        await conn.commit();

        io.to(`ticket:${ticketId}`)
            .emit(
                "ticket:update",
            );

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