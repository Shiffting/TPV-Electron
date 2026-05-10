import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('tpv', {
  get: (key: string) => localStorage.getItem(key),

  set: (key: string, value: string) => {
    localStorage.setItem(key, value)
  },

  clearToken: () => {
    localStorage.removeItem('token')
  }
})