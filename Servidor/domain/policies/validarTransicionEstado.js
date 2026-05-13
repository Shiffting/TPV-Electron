const transitions = {
  pendiente: ["enviado", "cancelado"],
  enviado: ["preparando", "listo", "cancelado"],
  preparando: ["listo", "cancelado"],
  listo: ["servido", "cancelado"],
  servido: [],
  cancelado: [],
};

export function validarTransicionEstado({ actual, siguiente }) {
  const permitidos = transitions[actual] || [];

  if (!permitidos.includes(siguiente)) {
    throw new Error(`Transición inválida: ${actual} → ${siguiente}`);
  }
}
