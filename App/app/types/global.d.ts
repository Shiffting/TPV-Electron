export {};

declare global {
  interface Window {
    api: {
      get: (key: 'baseURL' | 'token') => any;
      set: (key: 'baseURL' | 'token', value: any) => void;
      clearToken: () => void;
    };
  }
}
