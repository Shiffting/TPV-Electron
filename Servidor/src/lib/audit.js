import { pool } from '../db/pool.js';

export async function audit({ usuarioId = null, accion, detalle = null }) {
  try {
    await pool.execute(
      `INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?,?,?)`,
      [usuarioId, accion, detalle ? JSON.stringify(detalle) : null]
    );
  } catch (e) {
    // No romper el flujo por auditoría
    console.error('AUDIT_ERR', e.message);
  }
}
