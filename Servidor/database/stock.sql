-- =========================================
-- STOCK - MODELO BASE
-- =========================================
-- El stock se expresa en la unidad de compra/almacenamiento.
-- Por defecto un articulo se consume 1/1.
-- Solo los articulos marcados como fraccionables usan
-- fracciones estimadas por unidad.
--
-- Importante: las fracciones de alcohol y similares son una
-- referencia operativa, no una medicion fisica exacta.
-- =========================================

CREATE TABLE IF NOT EXISTS stock_articulos (
  id INT NOT NULL AUTO_INCREMENT,
  negocio_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  unidad VARCHAR(50) NOT NULL DEFAULT 'unidad',

  stock_actual DECIMAL(14,6) NOT NULL DEFAULT 0,
  stock_minimo DECIMAL(14,6) NOT NULL DEFAULT 0,

  coste_medio DECIMAL(12,4) NOT NULL DEFAULT 0,

  fraccionable TINYINT(1) NOT NULL DEFAULT 0,
  fracciones_por_unidad DECIMAL(14,6) NULL,
  nombre_fraccion VARCHAR(50) NULL,

  activo TINYINT(1) NOT NULL DEFAULT 1,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_stock_articulos_negocio (negocio_id),
  KEY idx_stock_articulos_activo (negocio_id, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
