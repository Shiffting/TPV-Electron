export async function crearSnapshotLinea({
  conn,
  lineaOriginal,
  createdByActionUuid,
  overrides = {},
  copiarPropiedades = true
}) {
  // =====================================
  // SNAPSHOT NUEVO
  // =====================================

  const snapshot = {
    line_group_uuid: lineaOriginal.line_group_uuid,
    ticket_id: lineaOriginal.ticket_id,
    producto_id: lineaOriginal.producto_id,
    nombre_producto: lineaOriginal.nombre_producto,
    cantidad: lineaOriginal.cantidad,
    pvp: lineaOriginal.pvp,
    pvp_base: lineaOriginal.pvp_base,
    total_linea: lineaOriginal.total_linea,
    estatus_financiero: lineaOriginal.estatus_financiero,
    estatus_operacional: lineaOriginal.estatus_operacional,
    config_hash: lineaOriginal.config_hash,
    ...overrides,
  };

  delete snapshot.total_linea;
  snapshot.total_linea = Number(
    (snapshot.cantidad * snapshot.pvp).toFixed(2)
  );

  const [[lineaActual]] = await conn.execute(
    `
      SELECT
        id,
        lifecycle_status,
        superseded_by_linea_id
      FROM ticket_lineas
      WHERE id = ?
      FOR UPDATE
    `,
    [lineaOriginal.id],
  );

  if (!lineaActual) {
    throw new Error(
      `Línea ${lineaOriginal.id} no encontrada`
    );
  }

  if (lineaActual.lifecycle_status !== 'activo') {
    throw new Error(
      `La línea ${lineaOriginal.id} no está activa`
    );
  }

  if (lineaActual.superseded_by_linea_id) {
    throw new Error(
      `La línea ${lineaOriginal.id} ya fue reemplazada`
    );
  }

  // =====================================
  // INSERT NUEVO SNAPSHOT
  // =====================================

  const [inserted] = await conn.execute(
    `
      INSERT INTO ticket_lineas
      (
        line_group_uuid,
        ticket_id,
        producto_id,
        nombre_producto,
        cantidad,
        pvp,
        pvp_base,
        total_linea,
        estatus_financiero,
        estatus_operacional,
        lifecycle_status,
        config_hash,
        previous_linea_id,
        created_by_action_uuid
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?, ?, ?)
      `,
    [
      snapshot.line_group_uuid,
      snapshot.ticket_id,
      snapshot.producto_id,
      snapshot.nombre_producto,
      snapshot.cantidad,
      snapshot.pvp,
      snapshot.pvp_base,
      snapshot.total_linea,
      snapshot.estatus_financiero,
      snapshot.estatus_operacional,
      snapshot.config_hash,
      lineaOriginal.id,
      createdByActionUuid
    ],
  );

  const nuevaLineaId = inserted.insertId;

  // =====================================
  // INVALIDAR ORIGINAL
  // =====================================

  const [updateResult] = await conn.execute(
    `
  UPDATE ticket_lineas
  SET
    lifecycle_status = 'anulado',
    superseded_by_linea_id = ?
  WHERE id = ?
    AND superseded_by_linea_id IS NULL
    AND lifecycle_status = 'activo'
  `,
    [nuevaLineaId, lineaOriginal.id],
  );

  if (updateResult.affectedRows !== 1) {
    throw new Error(
      `La línea ${lineaOriginal.id} ya fue reemplazada`
    );
  }

  // =====================================
  // COPIAR PROPIEDADES
  // =====================================

  await conn.execute(
    `
    INSERT INTO
      ticket_linea_propiedades
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
    [nuevaLineaId, lineaOriginal.id],
  );

  return {
    nuevaLineaId,
    snapshot
  };
}
