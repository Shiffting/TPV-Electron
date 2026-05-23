import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { pool } from "../../src/db/pool.js";

export async function login({
    email,
    password,
}) {
    // =====================================
    // USUARIO
    // =====================================

    const [[usuario]] = await pool.query(
        `
        SELECT *
        FROM usuarios
        WHERE email = ?
          AND activo = 1
        LIMIT 1
        `,
        [email],
    );
    console.log({
        email,
        password,
    });

    console.log(usuario);

    if (!usuario) {
        throw new Error(
            "USUARIO_O_CONTRASEÑA_INVALIDOS",
        );
    }

    // =====================================
    // PASSWORD
    // =====================================
    const ok =
        await bcrypt.compare(
            password,
            usuario.password_hash,
        );

    if (!ok) {
        throw new Error(
            "USUARIO_O_CONTRASEÑA_INVALIDOS",
        );
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