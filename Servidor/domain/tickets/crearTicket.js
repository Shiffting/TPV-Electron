import { pool } from "../../src/db/pool.js";

import {
    adjuntarAccionDeTicket,
} from "../../services/actionService.js";

export async function crearTicket({
    mesaId,
}) {

    const conn =
        await pool.getConnection();

    try {
        await conn.beginTransaction();
        // =====================================
        // BUSCAR TICKET ABIERTO
        // =====================================

        const [existentes] =
            await conn.execute(
                `
                SELECT id, version
                FROM tickets
                WHERE mesa_id = ?
                AND cerrado_en IS NULL
                LIMIT 1
                `,
                [mesaId],
            );

        const existente =
            existentes[0];

        // YA EXISTE
        if (existente) {
            await conn.commit();

            return {
                ok: true,
                ticketId:
                    existente.id,
                version:
                    existente.version,
                existente: true,
            };
        }

        // =====================================
        // CREAR NUEVO
        // =====================================

        const [insertado] =
            await conn.execute(
                `
                INSERT INTO tickets
                (
                  mesa_id,
                  estatus_financiero,
                  version
                )
                VALUES (?, 'pendiente', 1)
                `,
                [mesaId],
            );

        const ticketId =
            insertado.insertId;

        // =====================================
        // EVENTO
        // =====================================

        await adjuntarAccionDeTicket({
            conn,
            ticketId,
            tipoAccion:
                "TICKET_CREADO",
            payload: {
                mesaId,
            },

            aggregateVersion: 1,
        });

        await conn.commit();

        return {
            ok: true,
            ticketId,
            version: 1,
            existente: false,
        };

    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}