export function validarVersionTicket({
    versionActual,
    versionEsperada,
}) {
    // =====================================
    // SIN CONTROL CONCURRENCIA
    // =====================================

    if (versionEsperada == null) {
        return;
    }

    // =====================================
    // CONFLICTO
    // =====================================

    if (versionActual !== versionEsperada) {
        throw new Error(
            `CONFLICTO_DE_VERSION actual=${versionActual} esperada=${versionEsperada}`,
        );
    }
}