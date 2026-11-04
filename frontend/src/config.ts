/**
 * Zentrales Konfigurationsmodul. Alle Werte, die vom Deployment abhängen,
 * kommen aus Umgebungsvariablen (Dateien .env.development bzw. .env.production).
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
};
