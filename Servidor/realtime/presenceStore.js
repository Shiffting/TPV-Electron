const mesasActivas = new Map();

export function setMesaActiva({ mesaId, usuarioId, socketId }) {
  mesasActivas.set(mesaId, {
    usuarioId,
    socketId,
    updatedAt: Date.now(),
  });
}

export function liberarMesa(mesaId) {
  mesasActivas.delete(mesaId);
}

export function obtenerMesaActiva(mesaId) {
  return mesasActivas.get(mesaId);
}

export function obtenerMesasActivas() {
  return mesasActivas;
}
