import { pool } from "../../src/db/pool.js";

import { adjuntarAccionATicket } from "../helpers/adjuntarAccionATicket.js";

export async function crearTicket({
    mesaId,
}) {
    const conn = await pool.getConnection();

    try {
        // =====================================
        // EMPEZAMOS TRANSACCIÓN
        // =====================================

        await conn.beginTransaction();

        // =====================================
        // CREAMOS TICKET
        // =====================================

        const [insertado] = await conn.execute(
            `
            INSERT INTO tickets
            (
              mesa_id,
              estado_financiero,
              version
            )
            VALUES (?, 'abierto', 1)
            `,
            [mesaId],
        );

        const ticketId = insertado.insertId;

        // =====================================
        // REGISTRAMOS ACCIÓN
        // =====================================

        await adjuntarAccionATicket({
            conn,
            ticketId,
            tipoAccion: "TICKET_CREADO",
            payload: {
                mesaId,
            },
            version: 1,
        });

        // =====================================
        // COMMIT
        // =====================================

        await conn.commit();

        // =====================================
        // RESPUESTA
        // =====================================

        return {
            ok: true,
            ticketId,
            version: 1,
        };
    } catch (e) {
        await conn.rollback();

        throw e;
    } finally {
        conn.release();
    }
}