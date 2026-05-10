import { Router } from "express";
import { pool } from "../db/pool.js";

const r = Router();

/* =========================================
   LISTAR
========================================= */

r.get("/", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT *
    FROM estaciones
    WHERE activa = 1
    ORDER BY nombre
  `);
  res.json(rows);
});

/* =========================================
   CREAR
========================================= */

r.post("/", async (req, res) => {
  const {
    nombre,
    color = "#6366f1",
  } = req.body;
  const [ins] = await pool.execute(
    `
    INSERT INTO estaciones
    (nombre, color)
    VALUES (?, ?)
    `,
    [nombre, color],
  );

  res.json({
    id: ins.insertId,
  });
});

export default r;