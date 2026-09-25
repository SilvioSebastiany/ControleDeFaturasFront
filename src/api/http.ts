// Cliente HTTP fino para a API .NET (ControleDeFaturas.Api). Porta de
// js/api.js#apiFetch do legado (Divisor-de-Fatura): timeout de 30s e erro
// tipado a partir do corpo da resposta.
//
// Chama sempre "/api/..." (mesma origem do Vite dev server) — o proxy em
// vite.config.ts repassa para http://localhost:5125, sem precisar de CORS no
// backend (decisão do usuário).

const API_PREFIX = '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const TIMEOUT_MS = 30000;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(API_PREFIX + path, {
      ...options,
      signal: controller.signal,
    });
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') {
      throw new ApiError('Tempo esgotado ao falar com o servidor (30s).', 0);
    }
    throw erro;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    const mensagem =
      (corpo && typeof corpo === 'object' && 'title' in corpo && typeof corpo.title === 'string'
        ? corpo.title
        : null) ?? `HTTP ${response.status}`;
    throw new ApiError(mensagem, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function apiDelete(path: string): Promise<void> {
  return request<void>(path, { method: 'DELETE' });
}

export function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(path, { method: 'POST', body: formData });
}
