import { api } from "./client";

/* =========================================
   AUTH
========================================= */

export async function login(
  email: string,
  password: string,
) {
  const { data } = await api.post(
    "/auth/login",
    {
      email,
      password,
    },
  );

  return data;
}

/* =========================================
   //TICKETS
========================================= */

export async function crearTicket(
  mesaId?: number,
  empleadoId?: number
) {
  const { data } = await api.post(
    "/tickets",
    {
      mesaId,
      empleadoId
    },
  );

  return data;
}

export async function getTicket(
  ticketId: number,
) {
  const { data } = await api.get(
    `/tickets/${ticketId}`,
  );

  return data;
}

export async function getTickets() {
  const { data } = await api.get(
    "/tickets",
  );

  return data;
}

//EDITAR TICKET
export async function editarTicket(
  ticketId: number,
  body: {
    accion: string;
    payload?: any;
    version?: number;
  },
) {
  const { data } = await api.patch(
    `/tickets/${ticketId}`,
    body,
  );

  return data;
}

//AÑADIR LÍNEA
export async function addLinea(
  ticketId: number,
  payload: any,
  version: number,
) {
  return editarTicket(ticketId, {
    accion: "agregar_linea",
    payload,
    version,
  });
}

//EDITAR LÍNEA
export async function updateLinea(
  ticketId: number,
  lineaId: number,
  propiedades: any[],
  version: number,
) {
  return editarTicket(ticketId, {
    accion: "editar_linea",
    version,

    payload: {
      lineaId,
      propiedades,
    },
  });
}

//ELIMINAR LÍNEA
export async function eliminarLinea(
  ticketId: number,
  lineaId: number,
  version: number,
) {
  return editarTicket(ticketId, {
    accion: "eliminar_linea",
    version,
    payload: {
      lineaId,
    },
  });
}

//ENVIAR COCINA
export async function enviarCocina(
  ticketId: number,
  version: number,
) {
  return editarTicket(ticketId, {
    accion: "enviar_cocina",
    version,
  });
}

//AGREGAR PAGO
export async function agregarPago(
  ticketId: number,
  payload: {
    metodoPagoId: number;
    importe: number;
    lineas: {
      lineaId: number;
      importe: number;
    }[];
  },
  version: number,
) {
  return editarTicket(ticketId, {
    accion: "agregar_pago",
    version,
    payload,
  });
}

//PROCESAR COBRO
export async function procesarCobro(
  ticketId: number,
  payload: any,
  version: number,
) {
  return editarTicket(ticketId, {
    accion: "procesar_cobro",
    version,
    payload,
  });
}

//MESAS
export async function getMesas() {
  const { data } = await api.get(
    "/mesas",
  );

  return data;
}

//PRODUCTOS
export async function getProductos() {
  const { data } = await api.get(
    "/productos",
  );

  return data;
}


//Propiedades de producto
export async function getPropiedadesProducto(
  productoId: number,
) {

  const { data } = await api.get(
    `/productos/${productoId}/propiedades`,
  );

  return data;
}

//CATEGORÍAS
export async function getCategorias() {
  const { data } = await api.get(
    "/categorias",
  );

  return data;
}

/* =========================================
   ESTACIONES
========================================= */

export async function getEstaciones() {
  const { data } = await api.get(
    "/estaciones",
  );

  return data;
}

export async function getEstacion(
  estacionId: number,
) {

  const { data } = await api.get(
    `/estaciones/${estacionId}`,
  );

  return data;
}

export async function cambiarEstadoEstacion(
  ticketId: number,
  lineasIds: number[],
  estado: string,
) {

  return editarTicket(
    ticketId,
    {
      accion:
        "cambiar_estado_lineas",

      payload: {
        lineasIds,
        estado,
      },
    },
  );
}

//Dashboard
export async function getKpis(
  range = "today",
  negocioId = "",
) {

  const res =
    await api.get(
      "/reportes/dashboard",
      {
        params: {
          range,
          negocioId,
        },
      },
    );

  return res.data;
}