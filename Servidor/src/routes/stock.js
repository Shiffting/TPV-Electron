import { Router } from "express";

import { requireFeature } from "../lib/requireFeature.js";
import { FEATURES } from "../features/features.js";

import { crearArticulo } from "../../domain/stock/crearArticulo.js";
import { editarArticulo } from "../../domain/stock/editarArticulo.js";
import { eliminarArticulo } from "../../domain/stock/eliminarArticulo.js";
import { obtenerArticulos } from "../../projections/stock/obtenerArticulos.js";

const r = Router();

r.use(requireFeature(FEATURES.STOCK));

r.get("/articulos", async (req, res) => {
  try {
    const articulos = await obtenerArticulos({
      negocioId: req.user.negocioId,
      incluirInactivos: req.query.incluirInactivos === "1",
    });

    res.json(articulos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

r.post("/articulos", async (req, res) => {
  try {
    const articulo = await crearArticulo({
      negocioId: req.user.negocioId,
      nombre: req.body.nombre,
      unidad: req.body.unidad,
      stockActual: req.body.stockActual,
      stockMinimo: req.body.stockMinimo,
      costeMedio: req.body.costeMedio,
      fraccionable: req.body.fraccionable,
      fraccionesPorUnidad: req.body.fraccionesPorUnidad,
      nombreFraccion: req.body.nombreFraccion,
    });

    res.status(201).json(articulo);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

r.patch("/articulos/:articuloId", async (req, res) => {
  try {
    const articulo = await editarArticulo({
      negocioId: req.user.negocioId,
      articuloId: Number(req.params.articuloId),
      cambios: req.body,
    });

    res.json(articulo);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

r.delete("/articulos/:articuloId", async (req, res) => {
  try {
    const result = await eliminarArticulo({
      negocioId: req.user.negocioId,
      articuloId: Number(req.params.articuloId),
    });

    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default r;
