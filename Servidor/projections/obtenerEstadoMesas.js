import { pool } from "../src/db/pool.js";
import { obtenerEstadoOperacionalTicket } from "./obtenerEstadoOperacionalTicket.js";

export async function obtenerEstadoMesas() {
  // =====================================
  // MESAS
  // =====================================

  const [mesas] = await pool.query(
    `
    SELECT *
    FROM mesas
    ORDER BY id
    `,
  );

  // =====================================
  // TICKETS ACTIVOS
  // =====================================

  const [tickets] = await pool.query(
    `
    SELECT *
    FROM tickets
    WHERE financial_statur IN (
      'abierto',
      'parcial',
      'pagado'
    )
    `,
  );

  // =====================================
  // LÍNEAS OPERACIONALES
  // =====================================

  const [lineas] = await pool.query(
    `
    SELECT
      tl.*,
      t.mesa_id
    FROM ticket_lineas tl
    JOIN tickets t
      ON t.id = tl.ticket_id
    WHERE tl.lifecycle_status = 'activo'
      AND tl.estatus_operacional IN (
        'enviado',
        'preparando',
        'listo'
      )
    `,
  );

  // =====================================
  // MAPA TICKETS
  // =====================================

  const ticketsPorMesa = {};

  for (const ticket of tickets) {
    if (!ticket.mesa_id) {
      continue;
    }

    if (!ticketsPorMesa[ticket.mesa_id]) {
      ticketsPorMesa[ticket.mesa_id] = [];
    }

    ticketsPorMesa[ticket.mesa_id].push(ticket);
  }

  // =====================================
  // MAPA ALERTAS OPERACIONALES
  // =====================================

  const alertasPorMesa = {};

  for (const linea of lineas) {
    if (!linea.mesa_id) {
      continue;
    }

    alertasPorMesa[linea.mesa_id] = true;
  }

  // =====================================
  // DERIVAR ESTADO VISUAL
  // =====================================

  return mesas.map((mesa) => {
    const ticketsMesa = ticketsPorMesa[mesa.id] || [];

    const tieneAlertas = !!alertasPorMesa[mesa.id];

    let estadoVisual = "blanco";

    // =====================================
    // SIN TICKETS
    // =====================================
      
    if (ticketsMesa.length === 0) {
      return {
        ...mesa,
        estadoVisual,
        ticketsActivos: 0,
      };
    }
    
    // =====================================
    // ESTADOS OPERACIONALES
    // =====================================
    
    const estadosTickets =
      await Promise.all(
        ticketsMesa.map((t) =>
          obtenerEstadoOperacionalTicket(
            t.id,
          ),
        ),
      );
    
    // =====================================
    // ROJO
    // =====================================
    
    if (
      estadosTickets.some((e) =>
        ["enviado", "preparando", "listo"].includes(e),
      )
    ) {
      estadoVisual = "rojo";
    }
    
    // =====================================
    // VERDE
    // =====================================
    
    else if (
      ticketsMesa.every(
        (t) => t.estatus_financiero === ESTATUS_FINANCIERO.PAGADO,
      )
    ) {
      estadoVisual = "verde";
    }
    
    // =====================================
    // NARANJA
    // =====================================
    
    else {
      estadoVisual = "naranja";
    }
    
    return {
      ...mesa,
    
      estadoVisual,
    
      ticketsActivos:
        ticketsMesa.length,
    };
  });
}
