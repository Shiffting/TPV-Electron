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
    // NEGOCIO
    // =====================================

    const [[negocio]] =
        await pool.query(
            `
            SELECT id
            FROM negocios
            WHERE propietario_usuario_id = ?
            LIMIT 1
            `,
            [usuario.id],
        );

    if (!negocio) {
        throw new Error(
            "NEGOCIO_NO_ENCONTRADO",
        );
    }

    // =====================================
    // FEATURES
    // =====================================

    const [featuresRows] =
        await pool.query(
            `
            SELECT feature
            FROM negocios_features
            WHERE negocio_id = ?
              AND enabled = 1
            `,
            [negocio.id],
        );

    const features =
        featuresRows.map(
            (f) => f.feature,
        );

    // =====================================
    // TOKEN
    // =====================================

    const token = jwt.sign(
        {
            uid: usuario.id,
            email: usuario.email,
            role: usuario.role,
            negocioId: negocio.id,
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

        features,
    };
}