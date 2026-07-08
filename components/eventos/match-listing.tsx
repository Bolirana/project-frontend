'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BASE_URL, fetcher, splitTeams } from '@/lib/api'
import type { Evento } from '@/lib/types'
import { OddsButton } from '@/components/win/odds-button'
import { EmptyState, SkeletonRows, StatusBadge } from '@/components/win/shared'

const COLUMNS = ['Competición', 'Partido', 'Resultado Final 1X2']

function formatHora(fecha?: string) {
  if (!fecha) return '--:--'
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Cuotas reales del primer mercado del evento (no hay dato real para más
// mercados: el form de creación solo permite definir uno). Empareja por
// nombre de opción y cae a posición (1ra=local, 2da=visitante) si el admin
// usó nombres distintos a "Local"/"Visitante"/"Empate".
function cuotas1X2(evento: Evento): { uno: string; x: string | null; dos: string } {
  const opciones = evento.mercados?.[0]?.opciones ?? []
  if (opciones.length === 0) return { uno: '—', x: null, dos: '—' }

  const porNombre = (nombre: string) =>
    opciones.find((o) => o.nombre.trim().toLowerCase() === nombre)

  const local = porNombre('local') ?? opciones[0]
  const visitante = porNombre('visitante') ?? opciones[1]
  const empate = porNombre('empate')

  return {
    uno: local ? local.cuotaActual.toFixed(2) : '—',
    x: empate ? empate.cuotaActual.toFixed(2) : null,
    dos: visitante ? visitante.cuotaActual.toFixed(2) : '—',
  }
}

function MatchRow({ evento }: { evento: Evento }) {
  const [home, away] = splitTeams(evento.nombre)
  const odds = cuotas1X2(evento)

  const [selected, setSelected] = useState<string | null>(null)
  const pick = (key: string) => setSelected((s) => (s === key ? null : key))

  return (
    <div className="flex items-center gap-3 border-b border-[#1a2a3a] px-3 py-3">
      {/* Competición */}
      <div className="w-40 shrink-0">
        <div className="mb-1">
          <StatusBadge estado={evento.estado} />
        </div>
        <p className="text-xs text-[#8b9ab0]">{formatHora(evento.fechaEvento)}</p>
      </div>

      {/* Partido */}
      <div className="w-52 shrink-0">
        <p className="truncate text-sm font-semibold text-white">{home}</p>
        <p className="truncate text-sm font-semibold text-white">
          {away || '—'}
        </p>
      </div>

      {/* Resultado Final 1X2 — cuotas reales de opcion.cuotaActual */}
      <div className="flex shrink-0 gap-1">
        <OddsButton label="1" value={odds.uno} selected={selected === 'r-1'} onClick={() => pick('r-1')} />
        {odds.x && (
          <OddsButton label="X" value={odds.x} selected={selected === 'r-x'} onClick={() => pick('r-x')} />
        )}
        <OddsButton label="2" value={odds.dos} selected={selected === 'r-2'} onClick={() => pick('r-2')} />
      </div>
    </div>
  )
}

export function MatchListing() {
  const { data: eventos, isLoading } = useSWR<Evento[]>(
    `${BASE_URL}/eventos`,
    fetcher,
  )

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-white">
        Partidos y Competición
      </h2>
      <div className="overflow-hidden rounded-lg border border-[#2a3f55] bg-[#111827]">
        <div className="win-scroll overflow-x-auto">
          <div className="min-w-[450px]">
            {/* sticky column headers */}
            <div className="flex items-center gap-3 border-b border-[#2a3f55] bg-[#111827] px-3 py-2">
              <div className="w-40 shrink-0 text-xs font-bold uppercase text-[#f5a623]">
                {COLUMNS[0]}
              </div>
              <div className="w-52 shrink-0 text-xs font-bold uppercase text-[#f5a623]">
                {COLUMNS[1]}
              </div>
              <div className="w-[152px] shrink-0 text-xs font-bold uppercase text-[#f5a623]">
                {COLUMNS[2]}
              </div>
            </div>

            {isLoading && (
              <div className="p-3">
                <SkeletonRows rows={6} />
              </div>
            )}
            {!isLoading && eventos?.length === 0 && <EmptyState />}
            {eventos?.map((e) => (
              <MatchRow key={e.id} evento={e} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
