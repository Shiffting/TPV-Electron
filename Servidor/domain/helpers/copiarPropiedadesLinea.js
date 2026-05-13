export async function copiarPropiedadesLinea({
    conn,
    lineaOrigenId,
    lineaDestinoId,
}) {
    // =====================================
    // COPIAR PROPIEDADES
    // =====================================

    await conn.execute(
        `
    INSERT INTO ticket_linea_propiedades
    (
      ticket_linea_id,
      propiedad_id,
      precio_delta
    )

    SELECT
      ?,
      propiedad_id,
      precio_delta

    FROM ticket_linea_propiedades

    WHERE ticket_linea_id = ?
    `,
        [
            lineaDestinoId,
            lineaOrigenId,
        ],
    );
}