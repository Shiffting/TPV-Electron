import { ESTATUS_FINANCIERO } from "../constants/estatusFinanciero";

export function validarTicketEditable(ticket) {
  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  if (ticket.estatus_financiero === ESTATUS_FINANCIERO.PAGADO) {
    throw new Error("TICKET_ALREADY_pagado");
  }
}