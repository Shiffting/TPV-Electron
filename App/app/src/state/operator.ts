export interface Operator {
  id: number;
  nombre: string;
  rol: string;
}

const KEY = "active_operator";

export function setOperator(op: Operator) {
  localStorage.setItem(KEY, JSON.stringify(op));
}

export function getOperator(): Operator | null {
  const raw = localStorage.getItem(KEY);

  return raw ? JSON.parse(raw) : null;
}

export function clearOperator() {
  localStorage.removeItem(KEY);
}