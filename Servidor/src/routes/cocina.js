import { Router } from "express";
import { transicionarEstadoLinea } from "../../domain/cocina/transicionarEstadoLinea.js";
import { obtenerVistaCocina } from "../../projections/obtenerVistaCocina.js";
const r = Router();

/* =========================================
   LÍNEAS ACTIVAS COCINA
========================================= */

r.get("/", async (req, res) => {
  const vista = await obtenerVistaCocina();

  res.json(vista);
});

r.post("/lineas/:lineaId/:estado", async (req, res) => {
  try {
    const result = await transicionarEstadoLinea({
      lineaId: Number(req.params.lineaId),
      newStatus: req.params.estatus_operacional,
      usuarioId: req.user?.uid || null,
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
})

export default r;
