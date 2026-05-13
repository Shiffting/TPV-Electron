import { crearSnapshotLinea } from "./crearSnapshotLinea.js";
import { adjuntarAccionDeTicket } from "../../services/actionService.js";
import { vincularSnapshotAAccion } from "./vincularSnapshotAAccion.js";

export async function crearSnapshotConAccion({
    conn,
    lineaOriginal,
    overrides = {},
    ticketId,
    actionType,
    payload,
    actorUserId = null,
    aggregateVersion = null,
}) {
    const actionUuid = await adjuntarAccionDeTicket({
        conn,
        ticketId,
        actionType,
        payload,
        actorUserId,
        aggregateVersion,
    });

    const nuevaLineaId = await crearSnapshotLinea({
        conn,
        lineaOriginal,
        overrides,
    });

    await vincularSnapshotAAccion({
        conn,
        lineaId: nuevaLineaId,
        actionUuid,
    });

    return {
        nuevaLineaId,
        actionUuid,
    };
}
