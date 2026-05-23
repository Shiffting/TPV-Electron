import { Router } from "express";

import { crearProducto } from "../../domain/productos/crearProducto.js";
import { editarProducto } from "../../domain/productos/editarProducto.js";
import { eliminarProducto } from "../../domain/productos/eliminarProducto.js";
//import { obtenerProducto } from "../../projections/productos/obtenerProducto.js";
import { obtenerProductos } from "../../projections/productos/obtenerProductos.js";
import {obtenerPropiedadesProducto} from "../../projections/productos/obtenerPropiedadesProducto.js";

const r = Router();

/* =========================================
   OBTENER PRODUCTOS
========================================= */

r.get("/", async (req, res) => {
  try {
    const productos = await obtenerProductos(req.query);

    res.json(productos);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   OBTENER PRODUCTO
========================================= */

r.get("/:productoId", async (req, res) => {
  try {
    const producto = await obtenerProducto({
      productoId: Number(req.params.productoId),
    });

    res.json(producto);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   CREAR PRODUCTO
========================================= */

r.post("/", async (req, res) => {
  try {
    const result = await crearProducto(req.body);

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================
   EDITAR PRODUCTO
========================================= */

r.patch("/:productoId", async (req, res) => {
  try {
    const result = await editarProducto({
      productoId: Number(req.params.productoId),
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
   ELIMINAR PRODUCTO
========================================= */

r.delete("/:productoId", async (req, res) => {
  try {
    const result = await eliminarProducto({
      productoId: Number(req.params.productoId),
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

export default r;

/* =========================================
   OBTENER PROPIEDADES
========================================= */

r.get(
  "/:id/propiedades",
  async (req, res) => {

    try {

      const props =
        await obtenerPropiedadesProducto(
          req.params.id,
        );

      res.json(props);

    } catch (e) {

      res.status(500).json({
        error: e.message,
      });

    }
  },
);