import { Router } from "express";
import { pool } from "../db/pool.js";
import { verifyPassword, signToken } from "../lib/auth.js";

const r = Router();

r.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      error: "username y password requeridos",
    });
  }

  const [[u]] = await pool.query(
    `
    SELECT
      u.*,
      r.codigo AS rol_codigo

    FROM usuarios u

    JOIN roles r
      ON r.id = u.rol_id

    WHERE
      u.username = ?
      AND u.activo = 1
    `,
    [username],
  );

  if (!u) {
    return res.status(401).json({
      error: "Credenciales",
    });
  }

  const ok = await verifyPassword(password, u.password);

  if (!ok) {
    return res.status(401).json({
      error: "Credenciales",
    });
  }

  // =====================================
  // TOKEN
  // =====================================

  const token = signToken(u);

  // =====================================
  // AUDITORÍA
  // =====================================

  await pool.execute(
    `
    INSERT INTO auditoria
    (
      usuario_id,
      accion,
      detalle
    )
    VALUES
    (
      ?,
      'LOGIN',
      JSON_OBJECT('user', ?)
    )
    `,
    [u.id, u.username],
  );

  // =====================================
  // FEATURES
  // =====================================

  const [featuresRows] = await pool.query(
    `
    SELECT feature
    FROM negocios_features
    WHERE negocio_id = ?
      AND enabled = 1
    `,
    [u.negocio_id],
  );

  const features = featuresRows.map((f) => f.feature);

  // =====================================
  // RESPONSE
  // =====================================

  res.json({
    token,

    user: {
      id: u.id,
      nombre: u.nombre,
      rol: u.rol_codigo,
      negocioId: u.negocio_id,
      avatarColor: u.avatar_color,
    },

    features,
  });
});

// =========================================
// LOGIN PIN
// =========================================

r.post("/pin", async (req, res) => {
  const { pin } = req.body;

  // =====================================
  // BUSCAR USUARIO
  // =====================================

  const [[user]] = await pool.query(
    `
    SELECT
  u.*,
  r.codigo AS rol_codigo
FROM usuarios u
JOIN roles r
  ON r.id = u.rol_id
WHERE u.pin = ?
  AND u.activo = 1
LIMIT 1
    `,
    [pin],
  );

  console.log(user)

  if (!user) {
    return res.status(401).json({
      error: "PIN incorrecto",
    });
  }

  // =====================================
  // FEATURES
  // =====================================

  const [featuresRows] = await pool.query(
    `
    SELECT feature
    FROM negocios_features
    WHERE negocio_id = ?
      AND enabled = 1
    `,
    [user.negocio_id],
  );

  const features = featuresRows.map((f) => f.feature);

  // =====================================
  // TOKEN
  // =====================================

  const token = signToken(user);

  // =====================================
  // RESPONSE
  // =====================================

  res.json({
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      rol: user.rol_codigo,
      negocioId: user.negocio_id,
      avatarColor: user.avatar_color,
    },

    features,
  });
});

export default r;
