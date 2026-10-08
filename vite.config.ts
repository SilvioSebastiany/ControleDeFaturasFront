import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Destino do proxy "/api": por padrão a API de desenvolvimento (localhost:5125);
// o E2E (playwright.config.ts) sobe uma API própria em outra porta e aponta para
// ela via API_URL, para nunca encostar na API/banco de desenvolvimento.
const apiUrl = process.env.API_URL ?? 'http://localhost:5125'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Evita precisar de CORS no backend (ControleDeFaturas.Api, sem
    // configuração de CORS por decisão do usuário): o browser só enxerga a
    // origem do Vite, e o proxy repassa para a API (apiUrl).
    // O front chama sempre "/api/..." (ver src/api/http.ts).
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  // Testes de componente (Vitest + Testing Library). O E2E fica em e2e/ e é do Playwright.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
