import { Router } from "express";

//import { desactivarUsuario } from "../../domain/usuarios/desactivarUsuario.js";
//import { obtenerUsuario } from "../../projections/usuarios/obtenerUsuario.js";
//import { obtenerUsuarios } from "../../projections/usuarios/obtenerUsuarios.js";

const r = Router();

/* =========================================
   OBTENER USUARIOS
========================================= */

r.get("/", async (req, res) => {
  try {
    const usuarios = await obtenerUsuarios();

    res.json(usuarios);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   OBTENER USUARIO
========================================= */

r.get("/:usuarioId", async (req, res) => {
  try {
    const usuario = await obtenerUsuario({
      usuarioId: Number(req.params.usuarioId),
    });

    res.json(usuario);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   CREAR USUARIO
========================================= */

r.post("/", async (req, res) => {
  try {
    const result = await crearUsuario(req.body);

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   EDITAR USUARIO
========================================= */

r.patch("/:usuarioId", async (req, res) => {
  try {
    const result = await editarUsuario({
      usuarioId: Number(req.params.usuarioId),
      cambios: req.body,
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   DESACTIVAR USUARIO
========================================= */

r.delete("/:usuarioId", async (req, res) => {
  try {
    const result = await desactivarUsuario({
      usuarioId: Number(req.params.usuarioId),
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

export default r;