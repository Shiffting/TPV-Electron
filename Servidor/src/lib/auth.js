import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_2025';
const JWT_EXPIRES = '7d';

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
export function signToken(user) {
  return jwt.sign({ uid: user.id, role: user.rol_id, name: user.nombre }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
export function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
export function requireRole(...rolesCodigo) {
  // rolesCodigo: ['admin'], ['admin','caja'], etc.
  const map = { admin:1, camarero:2, caja:3 };
  const allowed = rolesCodigo.map(c=>map[c]);
  return (req,res,next)=>{
    if (!req.user) return res.status(401).json({ error: 'No auth' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Prohibido' });
    next();
  };
}
