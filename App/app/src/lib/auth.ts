import { setToken } from "../state/auth";

export function saveAuth(data: any) {
  setToken(data.token);

  localStorage.setItem(
    "user",
    JSON.stringify(data.user),
  );

  localStorage.setItem(
    "features",
    JSON.stringify(data.features || []),
  );
}

export function getUser() {
  const raw = localStorage.getItem("user");

  return raw ? JSON.parse(raw) : null;
}

export function getFeatures(): string[] {
  const raw = localStorage.getItem("features");

  return raw ? JSON.parse(raw) : [];
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("features");
}