import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// E2E do front. O Playwright sobe sozinho a API (modo de teste, banco
// controle_de_faturas_test — o mesmo dos testes da API) e o Vite; não depende do
// launch.json nem da API/banco de desenvolvimento (portas próprias, e
// reuseExistingServer desligado para nunca reaproveitar um servidor de dev).
//
// API_DIR: pasta do repo Controle-de-Faturas (default: irmã deste repo).
const apiDir = path.resolve(process.env.API_DIR ?? '../Controle-de-Faturas');
const apiUrl = 'http://localhost:5126';
const frontUrl = 'http://localhost:5174';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: frontUrl,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Development carrega os user-secrets (senha do Postgres); BancoDeDados
      // troca só o database e aplica as migrations (ver Program.cs da API).
      command: 'dotnet run --project src/api --no-launch-profile',
      cwd: apiDir,
      url: `${apiUrl}/faturas`,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ASPNETCORE_URLS: apiUrl,
        BancoDeDados: 'controle_de_faturas_test',
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: 'npm run dev -- --port 5174 --strictPort',
      url: frontUrl,
      env: { API_URL: apiUrl },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
