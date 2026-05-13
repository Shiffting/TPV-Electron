export async function crearSnapshotLinea({
    conn,
    lineaOriginal,
    cambios = {},
}) {
    // =====================================
    // NUEVO SNAPSHOT
    // =====================================

    const snapshot = {
        ticket_id: lineaOriginal.ticket_id,
        line_group_uuid: lineaOriginal.line_group_uuid,

        producto_id: lineaOriginal.producto_id,
        nombre_producto: lineaOriginal.nombre_producto,

        cantidad: lineaOriginal.cantidad,

        precio_unitario: lineaOriginal.precio_unitario,
        precio_base: lineaOriginal.precio_base,

        total_linea: lineaOriginal.total_linea,

        estado_operacional: lineaOriginal.estado_operacional,
        estado_financiero: lineaOriginal.estado_financiero,

        estado_snapshot: "activa",

        config_hash: lineaOriginal.config_hash,

        ...cambios,
    };

    // =====================================
    // INSERT NUEVA LÍNEA
    // =====================================

    const [insertado] = await conn.execute(
        `
    INSERT INTO ticket_lineas
    (
      ticket_id,
      line_group_uuid,

      producto_id,
      nombre_producto,

      cantidad,

      precio_unitario,
      precio_base,

      total_linea,

      estado_operacional,
      estado_financiero,

      estado_snapshot,

      config_hash
    )
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            snapshot.ticket_id,
            snapshot.line_group_uuid,

            snapshot.producto_id,
            snapshot.nombre_producto,

            snapshot.cantidad,

            snapshot.precio_unitario,
            snapshot.precio_base,

            snapshot.total_linea,

            snapshot.estado_operacional,
            snapshot.estado_financiero,

            snapshot.estado_snapshot,

            snapshot.config_hash,
        ],
    );

    const nuevaLineaId = insertado.insertId;

    // =====================================
    // INVALIDAMOS ORIGINAL
    // =====================================

    await conn.execute(
        `
        UPDATE ticket_lineas
        SET estado_snapshot = 'invalidada'
        WHERE id = ?
        `,
        [lineaOriginal.id],
    );

    // =====================================
    // DEVOLVEMOS NUEVA LÍNEA
    // =====================================

    return nuevaLineaId;
}