import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('tpv', {
  get: (key: string) => localStorage.getItem(key),

  set: (key: string, value: string) => {
    localStorage.setItem(key, value)
  },

  clearToken: () => {
    localStorage.removeItem('token')
  },

  printTicket: (ticket: unknown) => {
    return ipcRenderer.invoke('print-ticket', ticket)
  }
})