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

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
