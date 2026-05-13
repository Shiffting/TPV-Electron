import { obtenerLineasActivasTicket } from "./helpers/obtenerLineasActivasTicket.js";

export async function obtenerLineasVisualesTicket(ticketId) {
  // =====================================
  // LÍNEAS ACTIVAS
  // =====================================

  const lineas = await obtenerLineasActivasTicket(ticketId);

  // =====================================
  // AGRUPAR VISUALMENTE
  // =====================================

  const grupos = {};

  for (const linea of lineas) {
    // ===================================
    // CLAVE VISUAL
    // ===================================

    const key = [
      linea.producto_id,
      linea.config_hash,
      linea.estatus_operacional,
      linea.estatus_financiero,
    ].join("|");

    // ===================================
    // CREAR GRUPO
    // ===================================

    if (!grupos[key]) {
      grupos[key] = {
        id: key,
        productoId: linea.producto_id,
        nombreProducto: linea.nombre_producto,
        cantidad: 0,
        pvp: Number(linea.pvp),
        totalLinea: 0,
        operationalStatus: linea.estatus_operacional,
        propiedades: linea.propiedades || [],
        lineasInternas: [],
        lineGroupUuid: linea.line_group_uuid,
      };
    }

    // ===================================
    // ACUMULAR
    // ===================================

    grupos[key].cantidad += Number(linea.cantidad);
    grupos[key].totalLinea += Number(linea.total_linea);
    grupos[key].lineasInternas.push(linea.id);
  }

  // =====================================
  // ARRAY FINAL
  // =====================================

  return Object.values(grupos);
}
