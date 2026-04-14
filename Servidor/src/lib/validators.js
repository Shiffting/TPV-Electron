import { z } from 'zod';

export const CrearTicketSchema = z.object({
  mesaId: z.coerce.number().int().positive().nullable().optional()
});

export const AddLineaSchema = z.object({
  productoId: z.coerce.number().int().positive().optional(),
  nombreProducto: z.string().min(1, 'Required'),
  cantidad: z.coerce.number().positive().default(1),
  pvp: z.coerce.number().nonnegative(),
  propiedades: z.array(z.object({
    propiedadId: z.coerce.number().int().positive().optional(),
    texto: z.string().max(180).optional(),
    precioDelta: z.coerce.number().default(0)
  })).default([])
});

export const PagarParcialSchema = z.object({
  lineasIds: z.array(z.coerce.number().int().positive()),
  metodoCodigo: z.string().min(2),
  importe: z.coerce.number().positive()
});
