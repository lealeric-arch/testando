import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // base relativo para o app funcionar via file:// dentro do Electron.
  base: './',
  plugins: [react()],
  server: { port: 5173 },
});
