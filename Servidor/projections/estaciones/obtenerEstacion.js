import { obtenerEstaciones }
    from "./obtenerEstaciones.js";

export async function obtenerEstacion(
    estacionId,
) {
    const estaciones = await obtenerEstaciones();
    const estacion =
        estaciones.find(
            (e) =>
                e.id ===
                Number(estacionId),
        );

    if (!estacion) {
        throw new Error(
            "ESTACION_NO_ENCONTRADA",
        );
    }

    return estacion;
}