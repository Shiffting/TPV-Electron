import { useEffect, useMemo, useState } from "react";
import "../styles/modal-pago.css";

type MetodoPago = "tarjeta" | "efectivo";

export type Pago = {
    id: string;
    method: MetodoPago;
    importe: number;
    recibido?: number;
    cambio?: number;
    lineas: {
        lineaId: number;
        importe: number;
    }[];
    createdAt: number;
};

type ItemPago = {
    id: string;
    nombre: string;
    precio: number;
};

type LineaGrupo = {
    lineaId: string;
    nombre: string;
    subtotal: number;
    pagado: number;
};

type GrupoPago = {
    id: string;
    nombre: string;
    lineas: LineaGrupo[];
    pagos: Pago[];
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    items: ItemPago[];
    onConfirmarPagos: (pagos: Pago[]) => void;
    numeroClientes?: number;
};

const crearGrupo = (n: number): GrupoPago => ({
    id: crypto.randomUUID(),
    nombre: `Cliente ${n} `,
    lineas: [],
    pagos: [],
});

export default function ModalPago({
    isOpen,
    onClose,
    total,
    items,
    onConfirmarPagos,
    numeroClientes
}: Props) {
    const [grupos, setGrupos] =
        useState<GrupoPago[]>(() => {
            const cantidad = numeroClientes || 1;
            return Array.from(
                { length: cantidad },
                (_, i) =>
                    crearGrupo(i + 1),
            );
        });

    const [grupoId, setGrupoId] = useState("");
    const [metodo, setMetodo] = useState<MetodoPago | null>(null);
    const [importe, setImporte] = useState("");
    const [recibido, setRecibido] = useState("");

    useEffect(() => {
        if (!grupoId && grupos[0]) {
            setGrupoId(grupos[0].id);
        }
    }, [grupos]);

    const grupoActivo = useMemo(
        () => grupos.find((g) => g.id === grupoId),
        [grupos, grupoId],
    );

    const totalPagado = useMemo(
        () => grupos.reduce(
            (acc, g) =>
                acc + g.pagos.reduce(
                    (a, p) => a + p.importe,
                    0,
                ),
            0,
        ),
        [grupos],
    );

    const totalPendiente =
        items.reduce(
            (acc, item) =>
                acc + item.precio,
            0,
        );

    const pendienteGrupo = grupoActivo
        ? grupoActivo.lineas.reduce(
            (acc, l) =>
                acc + (
                    l.subtotal - l.pagado
                ),
            0,
        )
        : 0;

    const cambio = Math.max(
        Number(recibido || 0) - Number(importe || 0),
        0,
    );

    useEffect(() => {

        if (!metodo || importe) {
            return;
        }

        const valorInicial =
            pendienteGrupo > 0
                ? pendienteGrupo
                : totalPendiente;

        setImporte(
            valorInicial.toFixed(2),
        );

    }, [
        metodo,
        pendienteGrupo,
        totalPendiente,
    ]);

    if (!isOpen) return null;

    function resetMetodo() {
        setMetodo(null);
        setImporte("");
        setRecibido("");
    }

    function cerrar() {
        resetMetodo();
        onClose();
    }

    function lineaPendiente(
        grupo: GrupoPago,
        itemId: string,
    ) {
        const linea = grupo.lineas.find(
            (l) => l.lineaId === itemId,
        );

        if (!linea) return 0;

        return (
            linea.subtotal - linea.pagado
        );
    }

    function toggleLinea(item: ItemPago) {
        setGrupos((prev) => {
            const grupoPropietario =
                prev.find((g) =>
                    g.lineas.some((l) => {
                        const pendiente =
                            l.subtotal - l.pagado;

                        return (
                            l.lineaId === item.id &&
                            pendiente > 0.001
                        );
                    }),
                );

            if (
                grupoPropietario &&
                grupoPropietario.id !== grupoId
            ) {
                return prev;
            }

            return prev.map((g) => {
                if (g.id !== grupoId) {
                    return g;
                }

                const existe =
                    g.lineas.some(
                        (l) =>
                            l.lineaId === item.id &&
                            l.pagado < l.subtotal,
                    );

                if (existe) {
                    return {
                        ...g,
                        lineas: g.lineas.filter(
                            (l) => l.lineaId !== item.id,
                        ),
                    };
                }

                return {
                    ...g,
                    lineas: [
                        ...g.lineas,
                        {
                            lineaId: item.id,
                            nombre: item.nombre,
                            subtotal: item.precio,
                            pagado: 0,
                        },
                    ],
                };
            });
        });
    }

    function aplicarPago(cantidad: number) {
        setGrupos((prev) =>
            prev.map((g) => {
                if (g.id !== grupoId) {
                    return g;
                }

                let restante = cantidad;

                const lineas = g.lineas.map((l) => {
                    if (restante <= 0) {
                        return l;
                    }

                    const pendiente =
                        l.subtotal - l.pagado;

                    const pago = Math.min(
                        pendiente,
                        restante,
                    );

                    restante -= pago;

                    return {
                        ...l,
                        pagado: l.pagado + pago,
                    };
                });

                return {
                    ...g,
                    lineas,
                };
            }),
        );
    }

    function eliminarPago(
        grupoId: string,
        pagoId: string,
    ) {
        setGrupos((prev) =>
            prev.map((g) => {
                if (g.id !== grupoId) {
                    return g;
                }

                const pago = g.pagos.find(
                    (p) => p.id === pagoId,
                );

                if (!pago) {
                    return g;
                }

                let restante = pago.importe;

                const lineas = [...g.lineas]
                    .reverse()
                    .map((l) => {
                        if (restante <= 0) {
                            return l;
                        }

                        const descontar = Math.min(
                            l.pagado,
                            restante,
                        );

                        restante -= descontar;

                        return {
                            ...l,
                            pagado: l.pagado - descontar,
                        };
                    })
                    .reverse();

                return {
                    ...g,
                    lineas,
                    pagos: g.pagos.filter(
                        (p) => p.id !== pagoId,
                    ),
                };
            }),
        );
    }

    function confirmarPago() {

        const cantidad = Math.min(
            Number(importe || 0),
            pendienteGrupo,
            totalPendiente,
        );

        if (!cantidad) {
            return;
        }

        if (
            metodo === "efectivo" &&
            Number(recibido || 0) < cantidad
        ) {
            return;
        }

        const lineasPago =
            grupoActivo?.lineas
                .filter(
                    (l) =>
                        (
                            l.subtotal -
                            l.pagado
                        ) > 0.001,
                )
                .map((l) => ({

                    lineaId:
                        Number(l.lineaId),

                    importe:
                        Number(
                            (
                                l.subtotal -
                                l.pagado
                            ).toFixed(2),
                        ),
                })) || [];

        const pago: Pago = {
            id: crypto.randomUUID(),
            method: metodo!,
            importe: cantidad,
            recibido:
                metodo === "efectivo"
                    ? Number(recibido)
                    : undefined,
            cambio:
                metodo === "efectivo"
                    ? cambio
                    : undefined,
            lineas: lineasPago,
            createdAt: Date.now(),
        };

        setGrupos((prev) =>
            prev.map((g) =>
                g.id === grupoId
                    ? {
                        ...g,
                        pagos: [...g.pagos, pago],
                    }
                    : g,
            ),
        );

        aplicarPago(cantidad);
        resetMetodo();
    }

    async function finalizar() {
        const pagos =
            grupos.flatMap((g) =>
                g.pagos.map((p) => ({
                    metodoPagoId:
                        p.method === "tarjeta"
                            ? 1
                            : 2,
                    importe: p.importe,
                    lineas: p.lineas,
                })),
            );
        await onConfirmarPagos(
            grupos.flatMap((g) => g.pagos),
        );

        cerrar();
    }

    const quedanLineasPendientes =
        grupos.some((g) =>
            g.lineas.some(
                (l) =>
                    (
                        l.subtotal -
                        l.pagado
                    ) > 0.001,
            ),
        );

    const ticketCompletamentePagado =
        !quedanLineasPendientes;

    return (
        <div className="modal-pago-overlay">
            <div className="modal-pago">
                <div className="modal-pago-scroll">
                    <div className="modal-pago-header">
                        <h2>Cobrar ticket</h2>

                        <button
                            className="modal-pago-cerrar-btn"
                            onClick={cerrar}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="modal-pago-resumen">
                        <div className="modal-pago-resumen-card">
                            <span>Total</span>
                            <strong>{total.toFixed(2)} €</strong>
                        </div>

                        <div className="modal-pago-resumen-card">
                            <span>Pagado</span>
                            <strong>{totalPagado.toFixed(2)} €</strong>
                        </div>

                        <div className="modal-pago-resumen-card pendiente">
                            <span>Pendiente</span>
                            <strong>{totalPendiente.toFixed(2)} €</strong>
                        </div>
                    </div>

                    {!metodo && (
                        <div className="modal-pago-metodos">
                            <button
                                className="modal-pago-metodo-btn tarjeta"
                                onClick={() => {

                                    if (
                                        grupoActivo &&
                                        grupoActivo.lineas.length === 0
                                    ) {

                                        const lineasDisponibles =
                                            items.map((item) => ({
                                                lineaId: item.id,
                                                nombre: item.nombre,
                                                subtotal: item.precio,
                                                pagado: 0,
                                            }));

                                        setGrupos((prev) =>
                                            prev.map((g) =>
                                                g.id === grupoId
                                                    ? {
                                                        ...g,
                                                        lineas:
                                                            lineasDisponibles,
                                                    }
                                                    : g,
                                            ),
                                        );
                                    }

                                    setMetodo("tarjeta");
                                }}
                            >
                                💳 Tarjeta
                            </button>

                            <button
                                className="modal-pago-metodo-btn efectivo"
                                onClick={() => {

                                    if (
                                        grupoActivo &&
                                        grupoActivo.lineas.length === 0
                                    ) {

                                        const lineasDisponibles =
                                            items.map((item) => ({
                                                lineaId: item.id,
                                                nombre: item.nombre,
                                                subtotal: item.precio,
                                                pagado: 0,
                                            }));

                                        setGrupos((prev) =>
                                            prev.map((g) =>
                                                g.id === grupoId
                                                    ? {
                                                        ...g,
                                                        lineas:
                                                            lineasDisponibles,
                                                    }
                                                    : g,
                                            ),
                                        );
                                    }

                                    setMetodo("efectivo");
                                }}
                            >
                                💵 Efectivo
                            </button>
                        </div>
                    )}

                    {metodo && (

                        <div className="modal-pago-panel">

                            <button
                                className="modal-pago-volver"
                                onClick={resetMetodo}
                            >
                                ← Volver
                            </button>

                            {/* COBRAR */}

                            <div className="modal-pago-bloque">

                                <span className="modal-label">
                                    Cobrar
                                </span>

                                <div className="modal-pago-importes-rapidos">

                                    <button
                                        className="accion-btn"
                                        onClick={() =>
                                            setImporte(
                                                pendienteGrupo.toFixed(2),
                                            )
                                        }
                                    >
                                        Total
                                    </button>

                                    <button
                                        className="accion-btn"
                                        onClick={() =>
                                            setImporte(
                                                (
                                                    pendienteGrupo / 2
                                                ).toFixed(2),
                                            )
                                        }
                                    >
                                        Mitad
                                    </button>

                                    <button
                                        className="accion-btn"
                                        onClick={() =>
                                            setImporte(
                                                (
                                                    pendienteGrupo / 3
                                                ).toFixed(2),
                                            )
                                        }
                                    >
                                        1/3
                                    </button>

                                </div>

                            </div>

                            <input
                                type="number"
                                placeholder="Importe a cobrar"
                                value={importe}
                                onChange={(e) =>
                                    setImporte(
                                        e.target.value,
                                    )
                                }
                            />

                            {/* EFECTIVO */}

                            {metodo === "efectivo" && (

                                <>

                                    <div className="modal-pago-bloque">

                                        <span className="modal-label">
                                            Recibido
                                        </span>

                                        <div className="modal-pago-importes-rapidos">

                                            {[5, 10, 20, 50].map(
                                                (valor) => (

                                                    <button
                                                        key={valor}
                                                        className="accion-btn"
                                                        onClick={() => {

                                                            const actual =
                                                                Number(
                                                                    recibido || 0,
                                                                );

                                                            setRecibido(
                                                                String(
                                                                    actual + valor,
                                                                ),
                                                            );
                                                        }}
                                                    >
                                                        {valor}€
                                                    </button>
                                                ),
                                            )}

                                            <button
                                                className="accion-btn"
                                                onClick={() =>
                                                    setRecibido(
                                                        importe ||
                                                        pendienteGrupo.toFixed(2),
                                                    )
                                                }
                                            >
                                                Exacto
                                            </button>

                                        </div>

                                    </div>

                                    <input
                                        type="number"
                                        placeholder="Importe recibido"
                                        value={recibido}
                                        onChange={(e) =>
                                            setRecibido(
                                                e.target.value,
                                            )
                                        }
                                    />

                                    <div className="modal-pago-cambio">
                                        Cambio:
                                        {" "}
                                        {cambio.toFixed(2)} €
                                    </div>

                                </>

                            )}

                            <button
                                className="modal-pago-confirmar-btn"
                                disabled={
                                    pendienteGrupo <= 0
                                }
                                onClick={confirmarPago}
                            >
                                Confirmar {metodo}
                            </button>

                        </div>

                    )}

                    <div className="modal-pago-grupos-header">
                        {grupos.map((g) => {
                            const subtotal = g.lineas.reduce(
                                (acc, l) => acc + l.subtotal,
                                0,
                            );

                            return (
                                <button
                                    key={g.id}
                                    className={
                                        g.id === grupoId
                                            ? "grupo-btn activo"
                                            : "grupo-btn"
                                    }
                                    onClick={() => setGrupoId(g.id)}
                                >
                                    <div className="grupo-btn-contenido">
                                        <span>{g.nombre}</span>
                                        <strong>{subtotal.toFixed(2)} €</strong>
                                    </div>
                                </button>
                            );
                        })}

                        <button
                            className="grupo-btn nuevo"
                            onClick={() => {
                                const nuevo = crearGrupo(
                                    grupos.length + 1,
                                );

                                setGrupos([
                                    ...grupos,
                                    nuevo,
                                ]);

                                setGrupoId(nuevo.id);
                            }}
                        >
                            +
                        </button>
                    </div>

                    <div className="modal-pago-items">
                        {items
                            .filter((item) => {
                                const grupo = grupos.find(
                                    (g) =>
                                        g.lineas.some(
                                            (l) =>
                                                l.lineaId === item.id,
                                        ),
                                );

                                if (!grupo) {
                                    return true;
                                }

                                const pendiente = lineaPendiente(
                                    grupo,
                                    item.id,
                                );

                                if (pendiente <= 0.001) {
                                    return false;
                                }

                                return grupo.id === grupoId;
                            })
                            .map((item) => {
                                const seleccionado =
                                    grupoActivo?.lineas.some(
                                        (l) =>
                                            l.lineaId === item.id &&
                                            (
                                                l.subtotal - l.pagado
                                            ) > 0.001,
                                    );

                                return (
                                    <button
                                        key={item.id}
                                        className={
                                            seleccionado
                                                ? "modal-item-btn activo"
                                                : "modal-item-btn"
                                        }
                                        onClick={() =>
                                            toggleLinea(item)
                                        }
                                    >
                                        <div>{item.nombre}</div>

                                        <strong>
                                            {item.precio.toFixed(2)} €
                                        </strong>
                                    </button>
                                );
                            })}
                    </div>

                    <div className="modal-pago-lista">
                        {grupos.map((g) => (
                            <div key={g.id}>
                                <div className="grupo-pagos-titulo">
                                    {g.nombre}
                                </div>

                                {g.pagos.map((p) => (
                                    <div
                                        key={p.id}
                                        className="modal-pago-item"
                                    >
                                        <div className="modal-pago-item-top">
                                            <strong>
                                                {p.method === "tarjeta"
                                                    ? "💳 Tarjeta"
                                                    : "💵 Efectivo"}
                                            </strong>

                                            <span>
                                                {p.importe.toFixed(2)} €
                                            </span>
                                        </div>

                                        {p.method === "efectivo" && (
                                            <div className="modal-pago-item-extra">
                                                Recibido: {p.recibido?.toFixed(2)} € · Cambio: {p.cambio?.toFixed(2)} €
                                            </div>
                                        )}

                                        <button
                                            className="modal-pago-eliminar-btn"
                                            onClick={() =>
                                                eliminarPago(
                                                    g.id,
                                                    p.id,
                                                )
                                            }
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="modal-pago-footer">
                        <button
                            className="modal-pago-secundario-btn"
                            onClick={cerrar}
                        >
                            Cancelar
                        </button>

                        <button
                            className="modal-pago-finalizar-btn"
                            disabled={!ticketCompletamentePagado}
                            onClick={finalizar}
                        >
                            Finalizar cobro
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}