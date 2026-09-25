import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Evita precisar de CORS no backend (ControleDeFaturas.Api, sem
    // configuração de CORS por decisão do usuário): o browser só enxerga a
    // origem do Vite, e o proxy repassa para a API em localhost:5125.
    // O front chama sempre "/api/..." (ver src/api/http.ts).
    proxy: {
      '/api': {
        target: 'http://localhost:5125',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
