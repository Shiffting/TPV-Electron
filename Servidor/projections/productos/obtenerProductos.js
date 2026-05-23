import { pool } from "../../src/db/pool.js";

export async function obtenerProductos() {
  // =====================================
  // PRODUCTOS
  // =====================================

  const [productos] = await pool.query(
    `
        SELECT
          p.id,
          p.nombre,
          p.precio,
          p.imagen,
        
          p.categoria_id,
          c.nombre AS categoria_nombre,
        
          p.estacion_id,
          e.nombre AS estacion_nombre,

          p.requiere_configuracion
        FROM productos p
        
        LEFT JOIN categorias c
          ON c.id = p.categoria_id
        
        LEFT JOIN estaciones e
          ON e.id = p.estacion_id
        
        WHERE p.activo = 1
        
        ORDER BY p.nombre ASC
        `,
  );

  // =====================================
  // RESPUESTA
  // =====================================

  return productos.map((p) => ({
    id: p.id,

    nombre: p.nombre,

    precio: Number(p.precio),

    imagen: p.imagen,

    categoriaId: p.categoria_id,
    categoriaNombre:
      p.categoria_nombre,

    estacionId: p.estacion_id,
    estacionNombre:
      p.estacion_nombre,
    requiereConfiguracion:
      !!p.requiere_configuracion
  }));
}