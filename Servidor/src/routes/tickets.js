import { Router } from "express";
import { pool } from "../db/pool.js";
import {
  CrearTicketSchema,
  AddLineaSchema,
  PagarParcialSchema,
} from "../lib/validators.js";
import { audit } from "../lib/audit.js";
import { io } from "../app.js";

const r = Router();

// Crear ticket (opcionalmente ligado a mesa)
r.post("/", async (req, res) => {
  const parse = CrearTicketSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.issues);
  const { mesaId = null } = parse.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.execute(
      'INSERT INTO tickets (mesa_id, estado) VALUES (?, "abierto")',
      [mesaId],
    );
    const ticketId = ins.insertId;
    if (mesaId) {
      await conn.execute('UPDATE mesas SET estado="ocupada" WHERE id=?', [
        mesaId,
      ]);
    }
    await conn.commit();
    await audit({
      usuarioId: req.user?.uid || null,
      accion: "CREAR_TICKET",
      detalle: { ticketId, mesaId },
    });
    res.json({ ticketId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// Añadir línea (con merge de cantidad si ya existe)
r.post("/:ticketId/lineas", async (req, res) => {
  const parse = AddLineaSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.issues);

  const {
    productoId,
    nombreProducto,
    cantidad = 1,
    pvp,
    pvpBase,
    propiedades = [],
  } = parse.data;

  const configHash = [
    productoId,
    ...propiedades
      .map((p) => p.propiedadId)
      .filter(Boolean)
      .sort((a, b) => a - b),
  ].join("|");

  const ticketId = Number(req.params.ticketId);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Buscar si el producto ya existe en el ticket (pendiente)
    const [[existing]] = await conn.query(
      `SELECT id, cantidad, total_linea
   FROM ticket_lineas
   WHERE ticket_id = ?
   AND config_hash = ?
   AND estado = 'pendiente'`,
      [ticketId, configHash],
    );

    let lineaId;

    if (existing) {
      // === ACTUALIZAR CANTIDAD ===
      const newCantidad = existing.cantidad + cantidad;
      const newTotalLinea = +(newCantidad * pvp).toFixed(2);

      await conn.execute(
        `UPDATE ticket_lineas 
                 SET cantidad = ?, total_linea = ? 
                 WHERE id = ?`,
        [newCantidad, newTotalLinea, existing.id],
      );
      lineaId = existing.id;
    } else {
      // === INSERTAR NUEVA LÍNEA ===
      const totalLinea = +(cantidad * pvp).toFixed(2);
      const [ins] = await conn.execute(
        `INSERT INTO ticket_lineas 
  (
    ticket_id,
    producto_id,
    nombre_producto,
    cantidad,
    pvp,
    pvp_base,
    total_linea,
    estado,
    config_hash
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
        [
          ticketId,
          productoId,
          nombreProducto,
          cantidad,
          pvp,
          pvpBase,
          totalLinea,
          configHash,
        ],
      );
      lineaId = ins.insertId;

      // Insertar propiedades si existen
      for (const prop of propiedades) {
        await conn.execute(
          `INSERT INTO ticket_linea_propiedades 
              (ticket_linea_id, propiedad_id, precio_delta)
              VALUES (?, ?, ?)`,
          [lineaId, prop.propiedadId ?? null, prop.precioDelta ?? 0],
        );
      }
    }

    // 2. Actualizar totales del ticket
    await conn.execute(
      `UPDATE tickets t
             JOIN (
                SELECT ticket_id, SUM(total_linea) AS suma 
                FROM ticket_lineas 
                WHERE ticket_id = ? AND estado = 'pendiente'
             ) x ON x.ticket_id = t.id
             SET t.total_bruto = x.suma, t.total_neto = x.suma
             WHERE t.id = ?`,
      [ticketId, ticketId],
    );

    // 3. Actualizar mesa
    const [[tk]] = await conn.query("SELECT mesa_id FROM tickets WHERE id=?", [
      ticketId,
    ]);
    if (tk?.mesa_id) {
      await conn.execute(
        `UPDATE mesas 
                 SET items_pendientes = (
                    SELECT COUNT(*) FROM ticket_lineas 
                    WHERE ticket_id = ? AND estado = 'pendiente'
                 ), 
                 estado = 'ocupada' 
                 WHERE id = ?`,
        [ticketId, tk.mesa_id],
      );
    }

    await conn.commit();

    io.emit("cocina:update");
    io.emit("mesas:update");
    io.emit("ticket:update", ticketId);

    await audit({
      usuarioId: req.user?.uid || null,
      accion: "ADD_LINEA",
      detalle: { ticketId, lineaId, nombreProducto, cantidad, pvp },
    });

    res.json({ lineaId, ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// Pagar parcialmente (dividir cuenta por líneas)
r.post("/:ticketId/pagar-parcial", async (req, res) => {
  const parse = PagarParcialSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.issues);
  const { lineasIds, metodoCodigo, importe } = parse.data;
  const ticketId = Number(req.params.ticketId);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Método de pago
    const [[metodo]] = await conn.query(
      "SELECT id FROM metodos_pago WHERE codigo=? AND activo=1",
      [metodoCodigo],
    );
    if (!metodo) throw new Error("Método de pago inválido");

    // Marcar líneas pagadas
    const [upd] = await conn.query(
      `UPDATE ticket_lineas SET estado='pagado'
       WHERE ticket_id=? AND id IN (${lineasIds.map(() => "?").join(",")})`,
      [ticketId, ...lineasIds],
    );

    // Registrar pago
    await conn.execute(
      "INSERT INTO pagos (ticket_id, metodo_id, importe) VALUES (?, ?, ?)",
      [ticketId, metodo.id, importe],
    );

    // Recalcular totales y estado del ticket
    const [[pend]] = await conn.query(
      `SELECT COALESCE(SUM(total_linea),0) AS pendiente
       FROM ticket_lineas WHERE ticket_id=? AND estado='pendiente'`,
      [ticketId],
    );
    const [[pag]] = await conn.query(
      `SELECT COALESCE(SUM(total_linea),0) AS pagado
       FROM ticket_lineas WHERE ticket_id=? AND estado='pagado'`,
      [ticketId],
    );
    const total = Number(pend.pendiente) + Number(pag.pagado);

    await conn.execute(
      "UPDATE tickets SET total_bruto=?, total_neto=?, estado=? WHERE id=?",
      [
        total,
        total,
        Number(pend.pendiente) === 0 ? "cerrado" : "parcial",
        ticketId,
      ],
    );

    // Actualizar mesa si aplica
    const [[tk]] = await conn.query("SELECT mesa_id FROM tickets WHERE id=?", [
      ticketId,
    ]);
    if (tk?.mesa_id) {
      await conn.execute(
        `UPDATE mesas SET items_pendientes=?, estado=?
         WHERE id=?`,
        [
          Number(pend.pendiente) === 0 ? 0 : upd.affectedRows,
          Number(pend.pendiente) === 0 ? "libre" : "ocupada",
          tk.mesa_id,
        ],
      );
    }

    await conn.commit();
    io.emit("mesas:update");
    io.emit("ticket:update", ticketId);
    io.emit("dashboard:update");
    await audit({
      usuarioId: req.user?.uid || null,
      accion: "PAGAR_PARCIAL",
      detalle: { ticketId, lineasIds, metodoCodigo, importe },
    });
    res.json({
      ok: true,
      lineasActualizadas: upd.affectedRows,
      pendiente: Number(pend.pendiente),
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// Cerrar ticket (todo)
r.post("/:ticketId/cerrar", async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    //Cerramos el ticket
    await conn.execute(
      `UPDATE ticket_lineas SET estado='pagado' WHERE ticket_id=? AND estado='pendiente'`,
      [ticketId],
    );

    const [[ticket]] = await conn.query(
      "SELECT total_neto FROM tickets WHERE id=?",
      [ticketId],
    );

    const [[metodo]] = await conn.query(
      `SELECT id
        FROM metodos_pago
        WHERE codigo='efectivo'
        LIMIT 1`,
    );

    await conn.execute(
      `INSERT INTO pagos (ticket_id, metodo_id, importe)
        VALUES (?, ?, ?)`,
      [ticketId, metodo.id, ticket.total_neto],
    );
    await conn.execute(
      `UPDATE tickets SET estado='cerrado', cerrado_en=NOW() WHERE id=?`,
      [ticketId],
    );

    //Cogemos la mesa y la dejamos libre
    const [[tk]] = await conn.query("SELECT mesa_id FROM tickets WHERE id=?", [
      ticketId,
    ]);
    if (tk?.mesa_id) {
      await conn.execute(
        `UPDATE mesas SET estado='libre', items_pendientes=0 WHERE id=?`,
        [tk.mesa_id],
      );
    }
    await conn.commit();
    io.emit("mesas:update");
    io.emit("ticket:update", ticketId);
    io.emit("dashboard:update");
    await audit({
      usuarioId: req.user?.uid || null,
      accion: "CERRAR_TICKET",
      detalle: { ticketId },
    });
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// Obtener ticket completo (cabecera + lineas + propiedades + pagos)
r.get("/:ticketId", async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const [[tk]] = await pool.query("SELECT * FROM tickets WHERE id=?", [
    ticketId,
  ]);
  if (!tk) return res.status(404).json({ error: "Ticket no encontrado" });

  const [lineas] = await pool.query(
    `SELECT * FROM ticket_lineas WHERE ticket_id=? ORDER BY id`,
    [ticketId],
  );
  const [props] = await pool.query(
    `SELECT lp.*, p.nombre AS propiedad_nombre
     FROM ticket_linea_propiedades lp
     LEFT JOIN propiedades p ON p.id = lp.propiedad_id
     WHERE lp.ticket_linea_id IN (
       SELECT id FROM ticket_lineas WHERE ticket_id=?
     )
     ORDER BY lp.id`,
    [ticketId],
  );
  const [pagos] = await pool.query(
    `SELECT pg.*, mp.codigo, mp.nombre AS metodo_nombre
     FROM pagos pg
     JOIN metodos_pago mp ON mp.id = pg.metodo_id
     WHERE pg.ticket_id=?
     ORDER BY pg.id`,
    [ticketId],
  );

  // agrupar props por línea
  const propsByLinea = props.reduce((acc, p) => {
    (acc[p.ticket_linea_id] ||= []).push(p);
    return acc;
  }, {});
  const lineasConProps = lineas.map((l) => ({
    ...l,
    propiedades: propsByLinea[l.id] || [],
  }));

  const lineasNormalizadas = lineas.map((l) => ({
    id: l.id,
    ticketId: l.ticket_id,
    productoId: l.producto_id,
    nombreProducto: l.nombre_producto,
    cantidad: l.cantidad,
    pvp: Number(l.pvp),
    pvpBase: Number(l.pvp_base),
    totalLinea: Number(l.total_linea),
    estado: l.estado,
    propiedades: propsByLinea[l.id] || [],
  }));

  res.json({
    ticket: {
      id: tk.id,
      mesaId: tk.mesa_id,
      estado: tk.estado,
      totalBruto: Number(tk.total_bruto),
      totalNeto: Number(tk.total_neto),
      creadoEn: tk.creado_en,
      cerradoEn: tk.cerrado_en,
    },
    lineas: lineasNormalizadas,
    pagos,
  });
});

// Añadir propiedad de texto (o predefinida) a una línea existente
r.post("/lineas/:lineaId/propiedades", async (req, res) => {
  const lineaId = Number(req.params.lineaId);
  const { propiedadId = null, texto = null, precioDelta = 0 } = req.body || {};

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insertar propiedad
    const [ins] = await conn.execute(
      `INSERT INTO ticket_linea_propiedades (ticket_linea_id, propiedad_id, texto_libre, precio_delta)
       VALUES (?, ?, ?, ?)`,
      [lineaId, propiedadId, texto, precioDelta],
    );

    // Recalcular total de la línea
    if (precioDelta !== 0) {
      await conn.execute(
        "UPDATE ticket_lineas SET total_linea = total_linea + ? WHERE id = ?",
        [precioDelta, lineaId],
      );
      // Actualizar totales del ticket
      const [[tl]] = await conn.query(
        "SELECT ticket_id FROM ticket_lineas WHERE id=?",
        [lineaId],
      );
      if (tl?.ticket_id) {
        await conn.execute(
          `UPDATE tickets t
           JOIN (SELECT ticket_id, SUM(total_linea) AS suma
                 FROM ticket_lineas WHERE ticket_id=? AND estado='pendiente') x
           ON x.ticket_id=t.id
           SET t.total_bruto = COALESCE(x.suma,0), t.total_neto = COALESCE(x.suma,0)
           WHERE t.id=?`,
          [tl.ticket_id, tl.ticket_id],
        );
      }
    }

    await conn.commit();
    io.emit("mesas:update");
    io.emit("ticket:update", ticketId);
    io.emit("dashboard:update");
    res.json({ ok: true, propiedadId: ins.insertId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// =========================================
// EDITAR LÍNEA
// =========================================
r.patch("/lineas/:lineaId", async (req, res) => {
  const lineaId = Number(req.params.lineaId);

  const { propiedades = [] } = req.body;

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // =====================================
    // LÍNEA ACTUAL
    // =====================================
    const [[linea]] = await conn.query(
      `
      SELECT *
      FROM ticket_lineas
      WHERE id = ?
      `,
      [lineaId],
    );

    if (!linea) {
      throw new Error("Línea no encontrada");
    }

    // =====================================
    // BORRAR PROPIEDADES ACTUALES
    // =====================================
    await conn.execute(
      `
      DELETE FROM ticket_linea_propiedades
      WHERE ticket_linea_id = ?
      `,
      [lineaId],
    );

    // =====================================
    // INSERTAR NUEVAS PROPIEDADES
    // =====================================
    for (const prop of propiedades) {
      await conn.execute(
        `
        INSERT INTO ticket_linea_propiedades
        (
          ticket_linea_id,
          propiedad_id,
          precio_delta
        )
        VALUES (?, ?, ?)
        `,
        [lineaId, prop.propiedadId, prop.precioDelta || 0],
      );
    }

    // =====================================
    // RECALCULAR PRECIO
    // =====================================
    const extras = propiedades.reduce(
      (acc, p) => acc + Number(p.precioDelta || 0),
      0,
    );

    const nuevoPvp = Number(linea.pvp_base || linea.pvp) + extras;

    const nuevoTotal = nuevoPvp * linea.cantidad;

    // =====================================
    // NUEVO HASH
    // =====================================
    const configHash = [
      linea.producto_id,
      ...propiedades
        .map((p) => p.propiedadId)
        .filter(Boolean)
        .sort((a, b) => a - b),
    ].join("|");

    // =====================================
    // ACTUALIZAR LÍNEA
    // =====================================
    await conn.execute(
      `
      UPDATE ticket_lineas
      SET
        pvp = ?,
        total_linea = ?,
        config_hash = ?
      WHERE id = ?
      `,
      [nuevoPvp, nuevoTotal, configHash, lineaId],
    );

    // =====================================
    // RECALCULAR TICKET
    // =====================================
    await conn.execute(
      `
      UPDATE tickets t
      JOIN (
        SELECT
          ticket_id,
          SUM(total_linea) AS suma
        FROM ticket_lineas
        WHERE ticket_id = ?
          AND estado = 'pendiente'
      ) x ON x.ticket_id = t.id
      SET
        t.total_bruto = x.suma,
        t.total_neto = x.suma
      WHERE t.id = ?
      `,
      [linea.ticket_id, linea.ticket_id],
    );

    await conn.commit();
    io.emit("mesas:update");
    io.emit("ticket:update", linea.ticket_id);
    io.emit("dashboard:update");
    res.json({
      ok: true,
    });
  } catch (e) {
    await conn.rollback();

    res.status(500).json({
      error: e.message,
    });
  } finally {
    conn.release();
  }
});

//DECREMENTAR CANTIDAD
r.post("/lineas/:lineaId/decrementar", async (req, res) => {
  const lineaId = Number(req.params.lineaId);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar que la línea existe y está pendiente
    const [[linea]] = await conn.query(
      'SELECT * FROM ticket_lineas WHERE id = ? AND estado = "pendiente"',
      [lineaId],
    );

    if (!linea) {
      return res.status(404).json({ error: "Línea no encontrada o ya pagada" });
    }

    if (linea.cantidad <= 1) {
      // Si solo hay 1 unidad → eliminar la línea
      await conn.execute("DELETE FROM ticket_lineas WHERE id = ?", [lineaId]);
    } else {
      // Reducir cantidad
      await conn.execute(
        "UPDATE ticket_lineas SET cantidad = cantidad - 1, total_linea = total_linea - pvp WHERE id = ?",
        [lineaId],
      );
    }

    await conn.commit();
    io.emit("cocina:update");
    io.emit("mesas:update");
    io.emit("ticket:update", linea.ticket_id);
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

export default r;
