import { pool } from "../db/pool.js";
import { isKnownFeature } from "../features/features.js";

export function requireFeature(feature) {
  return async (req, res, next) => {
    const negocioId = req.user?.negocioId;

    if (!negocioId) {
      return res.status(401).json({
        error: "NEGOCIO_INVALIDO",
      });
    }

    if (!isKnownFeature(feature)) {
      return res.status(500).json({
        error: "FEATURE_NO_REGISTRADA",
      });
    }

    const [[row]] = await pool.query(
      `
      SELECT 1
      FROM negocios_features
      WHERE negocio_id = ?
        AND feature = ?
        AND enabled = 1
      LIMIT 1
      `,
      [negocioId, feature],
    );

    if (!row) {
      return res.status(403).json({
        error: "FEATURE_NO_DISPONIBLE",
        feature,
      });
    }

    next();
  };
}
