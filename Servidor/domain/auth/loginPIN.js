import jwt from "jsonwebtoken";

import { pool } from "../../src/db/pool.js";

export async function loginPIN({
    pin,
}) {
    // =====================================
    // USUARIO
    // =====================================

    const [[usuario]] = await pool.query(
        `
        SELECT *
        FROM usuarios
        WHERE pin = ?
          AND activo = 1
        LIMIT 1
        `,
        [pin],
    );

    if (!usuario) {
        throw new Error("PIN_INVALIDO");
    }

    // =====================================
    // TOKEN
    // =====================================

    const token = jwt.sign(
        {
            uid: usuario.id,
            email: usuario.email,
            role: usuario.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        },
    );

    // =====================================
    // RESPUESTA
    // =====================================

    return {
        token,

        usuario: {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            role: usuario.role,
        },
    };
}