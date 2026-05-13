import { Router } from "express";

import { crearCategoria } from "../../domain/categorias/crearCategoria.js";
import { editarCategoria } from "../../domain/categorias/editarCategoria.js";
import { eliminarCategoria } from "../../domain/categorias/eliminarCategoria.js";
import { obtenerCategoria } from "../../projections/categorias/obtenerCategoria.js";
import { obtenerCategorias } from "../../projections/categorias/obtenerCategorias.js";

const r = Router();

/* =========================================
   OBTENER CATEGORÍAS
========================================= */

r.get("/", async (req, res) => {
  try {
    const categorias = await obtenerCategorias();

    res.json(categorias);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   OBTENER CATEGORÍA
========================================= */

r.get("/:categoriaId", async (req, res) => {
  try {
    const categoria = await obtenerCategoria({
      categoriaId: Number(req.params.categoriaId),
    });

    res.json(categoria);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   CREAR CATEGORÍA
========================================= */

r.post("/", async (req, res) => {
  try {
    const result = await crearCategoria(req.body);

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   EDITAR CATEGORÍA
========================================= */

r.patch("/:categoriaId", async (req, res) => {
  try {
    const result = await editarCategoria({
      categoriaId: Number(req.params.categoriaId),
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
   ELIMINAR CATEGORÍA
========================================= */

r.delete("/:categoriaId", async (req, res) => {
  try {
    const result = await eliminarCategoria({
      categoriaId: Number(req.params.categoriaId),
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

export default r;