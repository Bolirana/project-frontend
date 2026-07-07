// Frontend talks to /api, which Next.js rewrites (see next.config.mjs) to
// the WIN24 Spring Boot backend at http://localhost:8080/api.
export const BASE_URL = '/api'

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
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json() as Promise<T>
}

export async function patchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'PATCH' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json() as Promise<T>
}

export async function del<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
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
