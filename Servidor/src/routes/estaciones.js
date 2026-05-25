import { Router } from "express";

import { crearEstacion } from "../../domain/estaciones/crearEstacion.js";
import { editarEstacion } from "../../domain/estaciones/editarEstacion.js";
import { eliminarEstacion } from "../../domain/estaciones/eliminarEstacion.js";
import { obtenerEstaciones } from "../../projections/estaciones/obtenerEstaciones.js";
import { obtenerEstacion } from "../../projections/estaciones/obtenerEstacion.js";

const r = Router();

/* =========================================
   OBTENER ESTACIONES
========================================= */

r.get("/", async (req, res) => {
  try {
    const estaciones = await obtenerEstaciones();

    res.json(estaciones);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   OBTENER ESTACIÓN
========================================= */

r.get("/:estacionId", async (req, res) => {
  try {
    const estacion = await obtenerEstacion({
      estacionId: Number(req.params.estacionId),
    });

    res.json(estacion);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   CREAR ESTACIÓN
========================================= */

r.post("/", async (req, res) => {
  try {
    const result = await crearEstacion(req.body);

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   EDITAR ESTACIÓN
========================================= */

r.patch("/:estacionId", async (req, res) => {
  try {
    const result = await editarEstacion({
      estacionId: Number(req.params.estacionId),
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
   ELIMINAR ESTACIÓN
========================================= */

r.delete("/:estacionId", async (req, res) => {
  try {
    const result = await eliminarEstacion({
      estacionId: Number(req.params.estacionId),
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

export default r;