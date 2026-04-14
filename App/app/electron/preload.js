// electron/preload.js
const { contextBridge } = require('electron');

console.log('🚀 PRELOAD EJECUTÁNDOSE...');

contextBridge.exposeInMainWorld('tpv', {
  get: (key) => {
    console.log(`📥 tpv.get(${key})`);
    if (key === 'baseURL') return 'http://localhost:8080';
    if (key === 'token') return null;
    return null;
  },
  set: (key, value) => {
    console.log(`💾 tpv.set(${key}, ${value})`);
  },
  clearToken: () => {
    console.log('🗑️ clearToken llamado');
  },
  isReady: () => true
});

console.log('✅ PRELOAD CARGADO CORRECTAMENTE - tpv expuesto');