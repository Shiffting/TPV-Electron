import { pool }
    from "../../src/db/pool.js";

export async function obtenerDashboard(
    {
        range = "today",
        negocioId = null,
    } = {},
) {

    const conn =
        await pool.getConnection();

    try {

        /* =====================================
           RANGE SQL
        ===================================== */

        let dateFilter = `
      DATE(t.cerrado_en)
        = CURDATE()
    `;

        let lineDateFilter = `
      DATE(tl.created_at)
        = CURDATE()
    `;

        if (range === "week") {

            dateFilter = `
        YEARWEEK(
          t.cerrado_en,
          1
        ) = YEARWEEK(
          CURDATE(),
          1
        )
      `;

            lineDateFilter = `
        YEARWEEK(
          tl.created_at,
          1
        ) = YEARWEEK(
          CURDATE(),
          1
        )
      `;
        }

        if (range === "month") {

            dateFilter = `
        YEAR(t.cerrado_en)
          = YEAR(CURDATE())

        AND MONTH(t.cerrado_en)
          = MONTH(CURDATE())
      `;

            lineDateFilter = `
        YEAR(tl.created_at)
          = YEAR(CURDATE())

        AND MONTH(tl.created_at)
          = MONTH(CURDATE())
      `;
        }

        if (range === "year") {

            dateFilter = `
        YEAR(t.cerrado_en)
          = YEAR(CURDATE())
      `;

            lineDateFilter = `
        YEAR(tl.created_at)
          = YEAR(CURDATE())
      `;
        }

        /* =====================================
           NEGOCIO FILTER
        ===================================== */

        let negocioFilter = "";

        if (negocioId) {

            negocioFilter = `
        AND t.negocio_id =
          ${Number(negocioId)}
      `;
        }

        /* =====================================
           KPIS
        ===================================== */

        const [[hoy]] =
            await conn.query(
                `
        SELECT

          COALESCE(
            SUM(t.total_bruto),
            0
          ) AS ventas,

          COUNT(*) AS tickets

        FROM tickets t

        WHERE
          t.estatus_financiero =
            'pagado'

          AND ${dateFilter}

          ${negocioFilter}
        `,
            );

        const ventas =
            Number(
                hoy.ventas || 0,
            );

        const tickets =
            Number(
                hoy.tickets || 0,
            );

        const ticketMedio =
            tickets > 0
                ? ventas / tickets
                : 0;

        /* =====================================
           MESAS OCUPADAS
        ===================================== */

        const [[mesas]] =
            await conn.query(
                `
        SELECT

          COUNT(
            DISTINCT mesa_id
          ) AS ocupadas

        FROM tickets t

        WHERE
          mesa_id IS NOT NULL

          AND t.estatus_financiero
            != 'pagado'

          ${negocioFilter}
        `,
            );

        /* =====================================
           EMPLEADOS ACTIVOS
        ===================================== */

        const [[empleados]] =
            await conn.query(
                `
        SELECT
          COUNT(*) AS activos

        FROM empleado_sesiones

        WHERE finalizada_en IS NULL
        `,
            );

        /* =====================================
           OPERACIONAL
        ===================================== */

        const [operacional] =
            await conn.query(
                `
        SELECT

          tl.estatus_operacional,

          COUNT(*) AS total

        FROM ticket_lineas tl

        INNER JOIN tickets t
          ON t.id = tl.ticket_id

        WHERE
          tl.lifecycle_status =
            'activo'

          ${negocioFilter}

        GROUP BY
          tl.estatus_operacional
        `,
            );

        const operationalMap = {

            pendiente: 0,
            enviado: 0,
            preparando: 0,
            listo: 0,
            servido: 0,
        };

        operacional.forEach(
            (o) => {

                operationalMap[
                    o.estatus_operacional
                ] = Number(o.total);
            },
        );

        /* =====================================
           VENTAS POR HORA
        ===================================== */

        const [ventasPorHora] =
            await conn.query(
                `
        SELECT

          HOUR(t.cerrado_en)
            AS hora,

          ROUND(
            SUM(t.total_bruto),
            2
          ) AS total

        FROM tickets t

        WHERE
          t.estatus_financiero =
            'pagado'

          AND ${dateFilter}

          ${negocioFilter}

        GROUP BY
          HOUR(t.cerrado_en)

        ORDER BY
          hora ASC
        `,
            );

        /* =====================================
           VENTAS POR DIA
        ===================================== */

        const [ventasPorDia] =
            await conn.query(
                `
        SELECT

          DATE(t.cerrado_en)
            AS fecha,

          ROUND(
            SUM(t.total_bruto),
            2
          ) AS total

        FROM tickets t

        WHERE
          t.estatus_financiero =
            'pagado'

          AND YEAR(
            t.cerrado_en
          ) = YEAR(CURDATE())

          AND MONTH(
            t.cerrado_en
          ) = MONTH(CURDATE())

          ${negocioFilter}

        GROUP BY
          DATE(t.cerrado_en)

        ORDER BY
          fecha ASC
        `,
            );

        /* =====================================
           TOP PRODUCTOS
        ===================================== */

        const [topProductos] =
            await conn.query(
                `
        SELECT

          p.nombre AS nombre,

          SUM(tl.cantidad)
            AS cantidad,

          ROUND(
            SUM(
              tl.cantidad *
              tl.precio_unitario
            ),
            2
          ) AS total

        FROM ticket_lineas tl

        INNER JOIN productos p
          ON p.id =
            tl.producto_id

        INNER JOIN tickets t
          ON t.id =
            tl.ticket_id

        WHERE
          tl.lifecycle_status =
            'activo'

          AND ${lineDateFilter}

          ${negocioFilter}

        GROUP BY
          p.id

        ORDER BY
          total DESC

        LIMIT 10
        `,
            );

        /* =====================================
           ACTIVIDAD
        ===================================== */

        const [actividad] =
            await conn.query(
                `
        SELECT

          ta.id,

          ta.action_type AS tipo,

          ta.creado_en,

          'Sistema'
            AS empleado_nombre

        FROM ticket_actions ta

        ORDER BY
          ta.creado_en DESC

        LIMIT 20
        `,
            );

        /* =====================================
           ESTACIONES
        ===================================== */

        const [estaciones] =
            await conn.query(
                `
        SELECT

          e.nombre,

          COUNT(tl.id)
            AS carga

        FROM estaciones e

        LEFT JOIN productos p
          ON p.estacion_id =
            e.id

        LEFT JOIN ticket_lineas tl
          ON tl.producto_id =
            p.id

        GROUP BY
          e.id

        ORDER BY
          carga DESC
        `,
            );

        /* =====================================
           NEGOCIOS
        ===================================== */

        const [negocios] =
            await conn.query(
                `
        SELECT
          id,
          nombre
        FROM negocios
        ORDER BY nombre ASC
        `,
            );

        return {

            range,

            hoy: {

                ventas,

                tickets,

                ticketMedio,

                mesasOcupadas:
                    Number(
                        mesas.ocupadas,
                    ),

                empleadosActivos:
                    Number(
                        empleados.activos,
                    ),
            },

            operacional:
                operationalMap,

            ventasPorHora,

            ventasPorDia,

            topProductos,

            actividad,

            estaciones,

            negocios,
        };

    } finally {

        conn.release();
    }
}