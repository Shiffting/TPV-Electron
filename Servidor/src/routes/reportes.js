import { Router } from "express";

//import { obtenerDashboard } from "../../projections/reportes/obtenerDashboard.js";
//import { obtenerVentas } from "../../projections/reportes/obtenerVentas.js";
//import { obtenerProductosTop } from "../../projections/reportes/obtenerProductosTop.js";

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

/* =========================================
   VENTAS
========================================= */

r.get("/ventas", async (req, res) => {
  try {
    const ventas = await obtenerVentas(req.query);

    res.json(ventas);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   PRODUCTOS TOP
========================================= */

r.get("/productos-top", async (req, res) => {
  try {
    const productos = await obtenerProductosTop(req.query);

    res.json(productos);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

export default r;