export function getEmpleado() {

  const raw =
    localStorage.getItem(
      "empleado",
    );

  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
}