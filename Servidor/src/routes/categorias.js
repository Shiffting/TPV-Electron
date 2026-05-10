import { Router } from 'express';
import { pool } from '../db/pool.js';

const r = Router();

r.get('/', async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM categorias`);
  res.json(rows);
});

export default r;