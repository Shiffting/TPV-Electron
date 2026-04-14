// src/state/auth.ts

const getTPV = () => {
  if (!window.tpv) {
    console.warn('⚠️ window.tpv aún no está listo');
    return null;
  }
  return window.tpv;
};

export function setBaseURL(url: string) {
  const tpv = getTPV();
  if (tpv) {
    tpv.set('baseURL', url);
  } else {
    console.error('No se pudo guardar baseURL: tpv no disponible');
  }
}

export function getBaseURL(): string {
  const tpv = getTPV();
  if (tpv) {
    return (tpv.get('baseURL') as string) || 'http://localhost:8080';
  }
  return 'http://localhost:8080';
}

export function setToken(token: string) {
  const tpv = getTPV();
  if (tpv) tpv.set('token', token);
}

export function getToken(): string | null {
  const tpv = getTPV();
  if (tpv) return tpv.get('token') as string | null;
  return null;
}

export function clearToken() {
  const tpv = getTPV();
  if (tpv) tpv.clearToken();
}

// Función útil para saber si ya está listo
export function isTPVReady(): boolean {
  return !!window.tpv;
}