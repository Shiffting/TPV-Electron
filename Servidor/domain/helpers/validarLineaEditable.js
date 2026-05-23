export function validarLineaEditable(linea) {
    // =====================================
    // LÍNEA INVALIDADA
    // =====================================

    if (linea.lifecycle_status === "invalidada") {
        throw new Error("LINEA_NO_EDITABLE");
    }
}