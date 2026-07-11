import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // No GitHub Pages o app fica em /testando/; no Electron/local usa caminho relativo (file://).
  base: process.env.DEPLOY_TARGET === 'pages' ? '/testando/' : './',
  plugins: [react()],
  server: { port: 5173 },
});
