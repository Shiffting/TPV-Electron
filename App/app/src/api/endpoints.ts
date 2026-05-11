import { api } from "./client";

// Auth
export async function login(username: string, password: string) {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
}

// Mesas
export async function getMesas() {
  const { data } = await api.get("/mesas");
  return data;
}

// Tickets
export async function crearTicket(mesaId?: number) {
  const { data } = await api.post("/tickets", { mesaId });
  return data;
}
export async function getTicket(id: number) {
  const { data } = await api.get(`/tickets/${id}`);
  return data;
}
export async function addLinea(ticketId: number, payload: any) {
  const { data } = await api.post(`/tickets/${ticketId}/lineas`, payload);
  return data;
}
export async function pagarParcial(ticketId: number, payload: any) {
  const { data } = await api.post(
    `/tickets/${ticketId}/pagar-parcial`,
    payload,
  );
  return data;
}

// KPIs
export async function getKpis() {
  const { data } = await api.get("/report/kpis");
  return data;
}

// Caja
export async function cajaAbrir(efectivoInicial = 0) {
  const { data } = await api.post("/caja/abrir", { efectivoInicial });
  return data;
}
export async function cajaMovimiento(payload: any) {
  const { data } = await api.post("/caja/movimiento", payload);
  return data;
}
export async function cajaAbierta() {
  const { data } = await api.get("/caja/abierta");
  return data;
}
export async function cajaCerrar(payload: any) {
  const { data } = await api.post("/caja/cerrar", payload);
  return data;
}

// Categorías
export async function getCategorias() {
  const { data } = await api.get("/categorias");
  return data;
}

// Productos
export async function getProductos() {
  const { data } = await api.get("/productos");
  return data;
}

// Restar unidad de línea
export async function decLinea(lineaId: number) {
  const { data } = await api.post(`/tickets/lineas/${lineaId}/decrementar`);
  return data;
}

//Ticket Mesa Abierta
export const getTicketAbiertoMesa = async (mesaId: number) => {
  const { data } = await api.get(`/mesas/${mesaId}/ticket-abierto`);
  return data;
};

//Cobrar y cerrar ticket
export async function cerrarTicket(ticketId: number) {
  const { data } = await api.post(`/tickets/${ticketId}/cerrar`);
  return data;
}

//Conseguir las propiedades de un producto
export async function getPropiedadesProducto(productoId: number) {
  const { data } = await api.get(`/productos/${productoId}/propiedades`);

  return data;
}

//Modificar propiedades de producto en ticket
export async function updateLinea(lineaId: number, data: any) {
  const res = await api.patch(`/tickets/lineas/${lineaId}`, data);

  return res.data;
}

//Listar estaciones
export async function getEstaciones() {
  const res = await api.get("/estaciones");

  return res.data;
}

//Recoger cocina y cambiar estados
export async function getCocina() {
  const res = await api.get("/cocina");

  return res.data;
}

export async function cambiarEstadoCocina(
  lineaId: number,
  estadoOperativo: string,
) {
  await api.patch(`/cocina/${lineaId}/estado`, {
    estadoOperativo,
  });
}

//Logueo rápido con PIN
export async function loginPIN(pin: string) {
  const { data } = await api.post("/auth/pin", { pin });

  return data;
}

//Bloquear mesa
export async function lockMesa(mesaId: number) {
  const { data } = await api.post(`/mesas/${mesaId}/lock`);

  return data;
}

//Desbloquear mesa
export async function unlockMesa(mesaId: number) {
  const { data } = await api.post(`/mesas/${mesaId}/unlock`);

  return data;
}

//Renovamos Lock periodicamente
export async function pingMesaLock(
  mesaId: number,
) {
  await api.post(
    `/mesas/${mesaId}/ping-lock`,
  );
}