# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Testes

- `npm test`: testes de componente (Vitest + Testing Library, `src/**/*.test.tsx`).
- `npm run test:e2e`: E2E (Playwright, `e2e/`). Sobe sozinho a API em modo de teste
  (banco `controle_de_faturas_test`, porta 5126) e o Vite (porta 5174); nao usa o
  `launch.json`. Pre-requisitos: Postgres local e user-secrets da API configurados;
  uma vez, `npx playwright install chromium`. A API e procurada em `../Controle-de-Faturas`
  (ou na pasta indicada em `API_DIR`).
