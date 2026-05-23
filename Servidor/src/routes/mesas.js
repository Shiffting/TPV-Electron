import { Router } from "express";

import { crearMesa } from "../../domain/mesas/crearMesa.js";
import { editarMesa } from "../../domain/mesas/editarMesa.js";
import { eliminarMesa } from "../../domain/mesas/eliminarMesa.js";
//import { obtenerMesa } from "../../projections/mesas/obtenerMesa.js";
import { obtenerMesas } from "../../projections/mesas/obtenerMesas.js";

const r = Router();

/* =========================================
   OBTENER MESAS
========================================= */

r.get("/", async (req, res) => {
  try {
    const mesas = await obtenerMesas();

    res.json(mesas);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   OBTENER MESA
========================================= */

r.get("/:mesaId", async (req, res) => {
  try {
    const mesa = await obtenerMesa({
      mesaId: Number(req.params.mesaId),
    });

    res.json(mesa);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   CREAR MESA
========================================= */

r.post("/", async (req, res) => {
  try {
    const result = await crearMesa(req.body);

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   EDITAR MESA
========================================= */

r.patch("/:mesaId", async (req, res) => {
  try {
    const result = await editarMesa({
      mesaId: Number(req.params.mesaId),
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
   ELIMINAR MESA
========================================= */

r.delete("/:mesaId", async (req, res) => {
  try {
    const result = await eliminarMesa({
      mesaId: Number(req.params.mesaId),
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

export default r;