import 'dotenv/config';
import { pool } from '../src/db/pool.js';
import { hashPassword } from '../src/lib/auth.js';

const username='admin', nombre='Administrador', password='admin123', rol_id=1;

const run = async ()=>{
  const pass_hash = await hashPassword(password);
  await pool.execute(`INSERT INTO usuarios (username, pass_hash, nombre, rol_id) VALUES (?,?,?,?)`,
                     [username, pass_hash, nombre, rol_id]);
  console.log('Admin creado');
  process.exit(0);
};
run();
