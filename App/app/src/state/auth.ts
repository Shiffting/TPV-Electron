// src/state/auth.ts

const getTPV = () => window.tpv;

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
  if (tpv) {
    tpv.set('token', token);
    console.log('💾 Token guardado en store');
  }
}

export function getToken(): string | null {
  const tpv = getTPV();
  if (!tpv) return null;
  return tpv.get('token') as string | null;
}

export function isTPVReady(): boolean {
  return !!window.tpv;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}