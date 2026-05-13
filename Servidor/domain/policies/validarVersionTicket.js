export function validarVersionTicket({ actual, esperada }) {
  if (esperada == null) {
    return;
  }

  // VERSION DISTINTA
  if (Number(actual) !== Number(esperada)) {
    throw new Error(`VERSION_CONFLICT actual=${actual} esperada=${esperada}`);
  }
}
