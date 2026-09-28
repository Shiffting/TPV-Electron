import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";

let win: BrowserWindow | null = null;

async function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(app.getAppPath(), "electron/dist/preload.cjs"),
      sandbox: false,
      contextIsolation: true,
    },
  });

  if (!app.isPackaged) {
    await win.loadURL("http://localhost:5173");
  } else {
    await win.loadFile(path.join(app.getAppPath(), "dist/index.html"));
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

ipcMain.handle("print-ticket", async (_event, ticket) => {
  console.log("[ELECTRON] Recibida petición print-ticket", {
    id: ticket?.id,
    mesa: ticket?.mesaNombre || "-",
    comensales: ticket?.comensales || 1,
    total: Number(ticket?.total || 0).toFixed(2) + " €",
    lineas: Array.isArray(ticket?.lineas) ? ticket.lineas.length : 0,
  });

  const printWindow = new BrowserWindow({
    show: false,
    width: 302,
    height: 800,
    webPreferences: {
      sandbox: true,
    },
  });

  const lineas = Array.isArray(ticket?.lineas) ? ticket.lineas : [];
  const lineasHtml = lineas.map((linea: any) => {
    const propiedades = Array.isArray(linea.propiedades)
      ? linea.propiedades
          .map((p: any) => '<div class="propiedad">- ' + escapeHtml(p.nombre) + '</div>')
          .join("")
      : "";

    return '<div class="linea">' +
      '<div class="linea-principal">' +
      '<span>' + escapeHtml(linea.cantidad) + ' x ' + escapeHtml(linea.nombreProducto) + '</span>' +
      '<span>' + Number(linea.subTotal || 0).toFixed(2) + ' €</span>' +
      '</div>' +
      propiedades +
      '</div>';
  }).join("");

  const html = '<!doctype html>' +
    '<html><head><meta charset="utf-8">' +
    '<style>' +
    '@page { margin: 0; size: 80mm auto; }' +
    '* { box-sizing: border-box; }' +
    'body { width: 72mm; margin: 0 auto; padding: 4mm 0; font-family: Arial, sans-serif; font-size: 12px; color: #000; }' +
    '.centrado { text-align: center; }' +
    'h1 { font-size: 18px; margin: 0 0 4px; }' +
    '.meta { margin-bottom: 10px; }' +
    '.separador { border-top: 1px dashed #000; margin: 8px 0; }' +
    '.linea { margin: 5px 0; }' +
    '.linea-principal { display: flex; justify-content: space-between; gap: 8px; }' +
    '.propiedad { font-size: 10px; margin-left: 12px; }' +
    '.total { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 8px; }' +
    '.pie { margin-top: 12px; text-align: center; font-size: 10px; }' +
    '</style></head><body>' +
    '<div class="centrado">' +
    '<h1>Ticket #' + escapeHtml(ticket?.id) + '</h1>' +
    '<div class="meta">Mesa: ' + escapeHtml(ticket?.mesaNombre || "-") +
    '<br>Comensales: ' + escapeHtml(ticket?.comensales || 1) + '</div>' +
    '</div>' +
    '<div class="separador"></div>' +
    (lineasHtml || '<div class="centrado">Sin productos</div>') +
    '<div class="separador"></div>' +
    '<div class="total"><span>TOTAL</span><span>' +
    Number(ticket?.total || 0).toFixed(2) + ' €</span></div>' +
    '<div class="pie">Gracias por su visita</div>' +
    '</body></html>';

  try {
    console.log("[ELECTRON] HTML del ticket generado");

    await printWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

    console.log("[ELECTRON] Ejecutando webContents.print()");

    await new Promise<void>((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          margins: { marginType: "none" },
          pageSize: { width: 80000, height: 200000 },
        },
        (success, reason) => {
          console.log("[ELECTRON] Resultado impresión:", { success, reason });

          if (success) {
            resolve();
          } else {
            reject(new Error(reason || "No se pudo imprimir"));
          }
        },
      );
    });

    console.log("[ELECTRON] Impresión finalizada correctamente");
    return { ok: true };
  } catch (error) {
    console.error("[ELECTRON] Error imprimiendo ticket:", error);
    throw error;
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
