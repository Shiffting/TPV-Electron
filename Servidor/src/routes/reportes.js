import { Router } from "express";

import { obtenerDashboard } from "../../projections/reportes/obtenerDashboard.js";

const r = Router();

/* =========================================
   DASHBOARD GENERAL
========================================= */

r.get("/dashboard", async (req, res) => {
  try {
    const dashboard = await obtenerDashboard(req.query);

    res.json(dashboard);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

export default r;