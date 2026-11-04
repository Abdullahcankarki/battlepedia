/// <reference types="vitest/config" />
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Der Entwicklungsserver läuft über HTTPS und leitet alle Aufrufe von /api an das Backend weiter.
// Dadurch laufen Frontend und API unter derselben Adresse und das HttpOnly-Cookie funktioniert ohne CORS.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), basicSsl()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL ?? 'https://localhost:8443',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      environment: 'jsdom',
    },
  };
});
