import { Router } from 'express';
import { pool } from '../db/pool.js';

const r = Router();

// Listar mesas con estado e items pendientes
r.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM mesas ORDER BY id');
  res.json(rows);
});

// Cambiar estado de mesa
r.patch('/:id/estado', async (req, res) => {
  const { estado, itemsPendientes } = req.body ?? {};
  const [result] = await pool.execute(
    'UPDATE mesas SET estado = COALESCE(?, estado), items_pendientes = COALESCE(?, items_pendientes) WHERE id = ?',
    [estado ?? null, itemsPendientes ?? null, req.params.id]
  );
  res.json({ updated: result.affectedRows === 1 });
});

// Mesas con items pendientes > 0
r.get('/ocupadas', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT m.*
     FROM mesas m
     WHERE m.items_pendientes > 0 OR m.estado IN ('ocupada','pendiente')
     ORDER BY m.id`
  );
  res.json(rows);
});

export default r;
