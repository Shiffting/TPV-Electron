import { contextBridge } from 'electron';
import Store from 'electron-store';

// Forzamos la API de store para evitar errores TS con .get/.set/.delete
type StoreAPI = {
  get: (k: 'baseURL' | 'token') => any;
  set: (k: 'baseURL' | 'token', v: any) => void;
  delete: (k: 'token') => void;
};

// crea la instancia tipada
const store = new (Store as unknown as { new<T>(): StoreAPI })<{
  baseURL: string;
  token: string | null;
}>();

contextBridge.exposeInMainWorld('tpv', {
  get: (key: 'baseURL' | 'token') => store.get(key),
  set: (key: 'baseURL' | 'token', val: any) => store.set(key, val),
  clearToken: () => store.delete('token'),
});
