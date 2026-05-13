export function validarLineaEditable(linea) {
    // =====================================
    // LÍNEA INVALIDADA
    // =====================================

    if (linea.estado_snapshot === "invalidada") {
        throw new Error("LINEA_NO_EDITABLE");
    }
}