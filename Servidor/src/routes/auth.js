import { Router } from "express";

import { login } from "../../domain/auth/login.js";
import { logout } from "../../domain/auth/logout.js";
import { obtenerSesionActual } from "../../projections/auth/obtenerSesionActual.js";

const r = Router();

/* =========================================
   LOGIN
========================================= */

r.post("/login", async (req, res) => {
  try {
    const result = await login({
      usuario: req.body.usuario,
      password: req.body.password,
    });

    res.json(result);
  } catch (e) {
    res.status(401).json({
      error: e.message,
    });
  }
});

/* =========================================
   LOGOUT
========================================= */

r.post("/logout", async (req, res) => {
  try {
    const result = await logout({
      usuarioId: req.user?.uid,
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   SESIÓN ACTUAL
========================================= */

r.get("/me", async (req, res) => {
  try {
    const sesion = await obtenerSesionActual({
      usuarioId: req.user?.uid,
    });

    res.json(sesion);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

export default r;