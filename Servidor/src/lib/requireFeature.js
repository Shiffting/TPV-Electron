import { pool } from "../db/pool.js";

export function requireFeature(feature) {
  return async (req, res, next) => {
    const negocioId = req.user?.negocioId;

    if (!negocioId) {
      return res.status(401).json({
        error: "Negocio inválido",
      });
    }
    
    const [[row]] = await pool.query(
      `
      SELECT *
      FROM negocios_features
      WHERE negocio_id = ?
      AND feature = ?
      AND enabled = 1
      `,
      [negocioId, feature],
    );

    if (!row) {
      return res.status(403).json({
        error: "Feature no disponible",
      });
    }
    

    next();
  };
}