// Frontend talks to /api, which Next.js rewrites (see next.config.mjs) to
// the WIN24 Spring Boot backend at http://localhost:8080/api.
export const BASE_URL = '/api'

// El backend responde los errores manejados (400/404/409/...) con un cuerpo
// { mensaje: string, ... } (ver GlobalExceptionHandler). ApiError guarda el
// status y, si vino, ese mensaje, sin cambiar `message` (se mantiene como
// `Error ${status}` por compatibilidad con código que ya lo parseaba así).
export class ApiError extends Error {
  status: number
  backendMessage?: string

  constructor(status: number, backendMessage?: string) {
    super(`Error ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.backendMessage = backendMessage
  }
}

async function mensajeDelBackend(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json()
    return typeof data?.mensaje === 'string' ? data.mensaje : undefined
  } catch {
    return undefined
  }
}

// Traduce un error de una llamada a la API a un mensaje de UI. `accion` describe
// la operación en curso (ej. "registrar la apuesta") para armar el mensaje genérico
// cuando el backend no trajo un mensaje propio.
export function mensajeError(err: unknown, accion: string): string {
  if (err instanceof ApiError) {
    if (err.status === 500) {
      return 'Error del servidor. Intenta de nuevo.'
    }
    if (err.backendMessage) {
      return err.backendMessage
    }
    if (err.status === 400) {
      return `No se pudo ${accion}. Verifica los datos.`
    }
  }
  return `No se pudo ${accion}.`
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json() as Promise<T>
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new ApiError(res.status, await mensajeDelBackend(res))
  return res.json() as Promise<T>
}

export async function patchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'PATCH' })
  if (!res.ok) throw new ApiError(res.status, await mensajeDelBackend(res))
  return res.json() as Promise<T>
}

export async function del<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw new ApiError(res.status, await mensajeDelBackend(res))
  return res.json() as Promise<T>
}

export function formatCOP(value: number): string {
  return `$ ${new Intl.NumberFormat('es-CO').format(Math.round(value))} COP`
}

// Split "Colombia vs Brasil" or "Real Madrid - Barcelona" into [home, away].
export function splitTeams(nombre: string): [string, string] {
  const parts = nombre.split(/\s+vs\s+|\s+-\s+/i)
  return [parts[0]?.trim() ?? nombre, parts[1]?.trim() ?? '']
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

// Deterministic pseudo-random odds per event id so they are stable between renders.
export function oddsFor(id: number): { uno: string; x: string; dos: string } {
  const base = (n: number) => (1.3 + ((id * n) % 25) / 10).toFixed(2)
  return { uno: base(7), x: base(13), dos: base(19) }
}

export function goalsOdds(id: number): { mas: string; menos: string } {
  const base = (n: number) => (1.5 + ((id * n) % 18) / 10).toFixed(2)
  return { mas: base(5), menos: base(11) }
}
