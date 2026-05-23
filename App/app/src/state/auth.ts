// src/state/auth.ts

const getTPV = () => window.tpv;

/* =========================================
   BASE URL
========================================= */

export function setBaseURL(
  url: string,
) {

  localStorage.setItem(
    "baseURL",
    url,
  );
}

export function getBaseURL() {

  return (
    localStorage.getItem(
      "baseURL",
    ) ||
    "http://localhost:8080"
  );
}

/* =========================================
   TOKEN
========================================= */

export function setToken(
  token: string,
) {

  localStorage.setItem(
    "tpv_token",
    token,
  );
}

export function getToken():
  string | null {

  return localStorage.getItem(
    "tpv_token",
  );
}

/* =========================================
   AUTH
========================================= */

export function isAuthenticated() {

  return !!getToken();
}