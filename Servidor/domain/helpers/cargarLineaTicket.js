export async function cargarLineaTicket({
    conn,
    lineaId,
}) {
    // =====================================
    // BUSCAMOS LÍNEA
    // =====================================

    const [[linea]] = await conn.query(
        `
        SELECT *
        FROM ticket_lineas
        WHERE id = ?
        LIMIT 1
        `,
        [lineaId],
    );

    // =====================================
    // VALIDAMOS EXISTENCIA
    // =====================================

    if (!linea) {
        throw new Error("LINEA_NO_ENCONTRADA");
    }

    return linea;
}