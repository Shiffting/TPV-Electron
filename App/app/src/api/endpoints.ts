import { api } from './client';

// Auth
export async function login(username: string, password: string){
  const { data } = await api.post('/auth/login', { username, password });
  return data;
}

// Mesas
export async function getMesas(){ const { data } = await api.get('/mesas'); return data; }

// Tickets
export async function crearTicket(mesaId?: number){ const { data } = await api.post('/tickets',{ mesaId }); return data; }
export async function getTicket(id: number){ const { data } = await api.get(`/tickets/${id}`); return data; }
export async function addLinea(ticketId: number, payload: any){ const { data } = await api.post(`/tickets/${ticketId}/lineas`, payload); return data; }
export async function pagarParcial(ticketId: number, payload: any){ const { data } = await api.post(`/tickets/${ticketId}/pagar-parcial`, payload); return data; }

// KPIs
export async function getKpis(){ const { data } = await api.get('/report/kpis'); return data; }

// Caja
export async function cajaAbrir(efectivoInicial=0){ const { data } = await api.post('/caja/abrir',{ efectivoInicial }); return data; }
export async function cajaMovimiento(payload: any){ const { data } = await api.post('/caja/movimiento', payload); return data; }
export async function cajaAbierta(){ const { data } = await api.get('/caja/abierta'); return data; }
export async function cajaCerrar(payload: any){ const { data } = await api.post('/caja/cerrar', payload); return data; }
