import { Router } from 'express';
import { pool } from '../db/pool.js';

const r = Router();

r.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.nombre AS categoria
     FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     WHERE p.activo = 1
     ORDER BY c.nombre, p.nombre`
  );
  res.json(rows);
});

export default r;
