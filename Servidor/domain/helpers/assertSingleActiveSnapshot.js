export function assertSingleActiveSnapshot(lineas) {
    const grupos = new Map();

    for (const linea of lineas) {

        if (linea.lifecycle_status !== "activo") {
            continue;
        }

        const count =
            grupos.get(linea.line_group_uuid) || 0;

        grupos.set(
            linea.line_group_uuid,
            count + 1
        );
    }

    for (const [groupUuid, count] of grupos) {
        if (count > 1) {
            throw new Error(
                `Snapshots activos duplicados para ${groupUuid}`
            );
        }
    }
}