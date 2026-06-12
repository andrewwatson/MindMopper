import { getOrCreateUserId } from '../identity/userId'

const BASE = '/api'

interface RequestOptions extends RequestInit {
  noAuth?: boolean
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { noAuth, ...init } = opts
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (!noAuth) {
    headers.set('X-User-Id', getOrCreateUserId())
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  getPublic: <T>(path: string) => request<T>(path, { noAuth: true }),
}
