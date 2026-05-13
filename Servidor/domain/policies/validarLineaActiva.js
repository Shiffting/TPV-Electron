export function validarLineaActiva(linea) {
  if (!linea) {
    throw new Error("Línea no encontrada");
  }

  if (linea.superseded_by_linea_id) {
    throw new Error("La línea ya fue reemplazada");
  }

  if (linea.lifecycle_status !== "activo") {
    throw new Error("La línea ya no está activa");
  }
}
