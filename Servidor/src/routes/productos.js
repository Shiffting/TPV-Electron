import { Router } from "express";
import { pool } from "../db/pool.js";

const r = Router();

/* =========================================================
   GET PRODUCTOS
========================================================= */

r.get("/", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.nombre AS categoria
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     WHERE p.activo = 1
     ORDER BY c.nombre, p.nombre`,
  );

  res.json(rows);
});

/* =========================================================
   GET PROPIEDADES DE PRODUCTO
========================================================= */

r.get("/:id/propiedades", async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    `
    SELECT
      pr.id,
      pr.nombre,
      pr.precio_delta
    FROM producto_propiedades pp
    JOIN propiedades pr
      ON pr.id = pp.propiedad_id
    WHERE pp.producto_id = ?
    `,
    [id],
  );

  res.json(rows);
});

export default r;
