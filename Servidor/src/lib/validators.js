import { z } from "zod";

export const CrearTicketSchema = z.object({
  mesaId: z.coerce.number().int().positive().nullable().optional(),
});

export const AddLineaSchema = z.object({
  productoId: z.number(),
  nombreProducto: z.string(),
  cantidad: z.number().optional(),
  pvp: z.coerce.number(),
  pvpBase: z.coerce.number(),
  propiedades: z
    .array(
      z.object({
        propiedadId: z.number().nullable().optional(),
        texto: z.string().nullable().optional(),
        precioDelta: z.coerce.number().optional(),
      }),
    )
    .optional(),
});

export const PagarParcialSchema = z.object({
  lineasIds: z.array(z.coerce.number().int().positive()),
  metodoCodigo: z.string().min(2),
  importe: z.coerce.number().positive(),
});
