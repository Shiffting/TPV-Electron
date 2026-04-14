import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyPassword, signToken } from '../lib/auth.js';

const r = Router();

r.post('/login', async (req,res)=>{
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username y password requeridos' });

  const [[u]] = await pool.query(
    `SELECT u.*, r.codigo AS rol_codigo FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.username=? AND u.activo=1`,
    [username]
  );
  if (!u) return res.status(401).json({ error: 'Credenciales' });

  const ok = await verifyPassword(password, u.password);
  if (!ok) return res.status(401).json({ error: 'Credenciales' });

  const token = signToken(u);
  await pool.execute(`INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?, 'LOGIN', JSON_OBJECT('user', ?))`, [u.id, u.username]);
  res.json({ token, user: { id:u.id, nombre:u.nombre, rol:u.rol_codigo } });
});

export default r;
