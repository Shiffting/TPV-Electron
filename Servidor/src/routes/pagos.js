import { Router } from 'express';
import { pool } from '../db/pool.js';

const r = Router();

r.get('/metodos', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM metodos_pago WHERE activo=1 ORDER BY id');
  res.json(rows);
});

export default r;
