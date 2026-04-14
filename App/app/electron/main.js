"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
let win = null;
async function createWindow() {
    win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: node_path_1.default.join(electron_1.app.getAppPath(), 'electron/preload.js')
        }
    });
    if (!electron_1.app.isPackaged) {
        await win.loadURL('http://localhost:5173');
    }
    else {
        await win.loadFile(node_path_1.default.join(electron_1.app.getAppPath(), 'dist/index.html'));
    }
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
