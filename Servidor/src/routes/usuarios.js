import { Router } from 'express';
import { pool } from '../db/pool.js';
import { hashPassword } from '../lib/auth.js';
import { authMiddleware, requireRole } from '../lib/auth.js';

const r = Router();
r.use(authMiddleware, requireRole('admin'));

r.get('/', async (_req,res)=>{
  const [rows] = await pool.query(`SELECT u.id, u.username, u.nombre, r.codigo AS rol, u.activo, u.creado_en
                                   FROM usuarios u JOIN roles r ON r.id=u.rol_id ORDER BY u.id`);
  res.json(rows);
});

r.post('/', async (req,res)=>{
  const { username, nombre, password, rol = 'camarero' } = req.body || {};
  const map = { admin:1, camarero:2, caja:3 };
  if (!username || !nombre || !password) return res.status(400).json({ error: 'faltan campos' });
  const pass_hash = await hashPassword(password);
  const rol_id = map[rol] ?? 2;

  try {
    const [ins] = await pool.execute(`INSERT INTO usuarios (username, pass_hash, nombre, rol_id) VALUES (?,?,?,?)`,
                                     [username, pass_hash, nombre, rol_id]);
    res.json({ id: ins.insertId });
  } catch (e) {
    res.status(400).json({ error: e.code === 'ER_DUP_ENTRY' ? 'username ya existe' : e.message });
  }
});

r.patch('/:id', async (req,res)=>{
  const { nombre, password, rol, activo } = req.body || {};
  const sets = []; const vals=[];
  if (nombre != null){ sets.push('nombre=?'); vals.push(nombre); }
  if (password){ sets.push('pass_hash=?'); vals.push(await hashPassword(password)); }
  if (rol){ const map = { admin:1,camarero:2,caja:3 }; sets.push('rol_id=?'); vals.push(map[rol] ?? 2); }
  if (activo != null){ sets.push('activo=?'); vals.push(!!activo ? 1 : 0); }
  if (!sets.length) return res.json({ updated:false });

  vals.push(req.params.id);
  const [upd] = await pool.execute(`UPDATE usuarios SET ${sets.join(', ')} WHERE id=?`, vals);
  res.json({ updated: upd.affectedRows===1 });
});

export default r;
