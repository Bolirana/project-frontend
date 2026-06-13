'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BASE_URL, fetcher, goalsOdds, oddsFor, splitTeams } from '@/lib/api'
import type { Evento } from '@/lib/types'
import { OddsButton } from '@/components/win/odds-button'
import { EmptyState, SkeletonRows, StatusBadge } from '@/components/win/shared'

const COLUMNS = [
  'Competición',
  'Partido & Total de goles',
  'Resultado Final 1X2',
  'Ambos equipos marcarán',
  'Doble Oportunidad',
  'Total de goles',
  'Apuesta sin empate',
  '',
]

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

function MatchRow({ evento }: { evento: Evento }) {
  const [home, away] = splitTeams(evento.nombre)
  const odds = oddsFor(evento.id)
  const goals = goalsOdds(evento.id)
  const dbl = oddsFor(evento.id + 1)
  const ambos = goalsOdds(evento.id + 2)
  const sinEmpate = oddsFor(evento.id + 3)
  const masApuestas = 100 + ((evento.id * 137) % 800)

  const [selected, setSelected] = useState<string | null>(null)
  const pick = (key: string) => setSelected((s) => (s === key ? null : key))

  return (
    <div className="flex items-center gap-3 border-b border-[#1a2a3a] px-3 py-3">
      {/* Competición */}
      <div className="w-40 shrink-0">
        <div className="mb-1">
          <StatusBadge estado={evento.estado} />
        </div>
        <p className="text-xs text-[#8b9ab0]">{formatHora(evento.fecha)}</p>
      </div>

      {/* Partido */}
      <div className="w-52 shrink-0">
        <p className="truncate text-sm font-semibold text-white">{home}</p>
        <p className="truncate text-sm font-semibold text-white">
          {away || '—'}
        </p>
      </div>

      {/* Resultado Final 1X2 */}
      <div className="flex shrink-0 gap-1">
        <OddsButton label="1" value={odds.uno} selected={selected === 'r-1'} onClick={() => pick('r-1')} />
        <OddsButton label="X" value={odds.x} selected={selected === 'r-x'} onClick={() => pick('r-x')} />
        <OddsButton label="2" value={odds.dos} selected={selected === 'r-2'} onClick={() => pick('r-2')} />
      </div>

      {/* Ambos equipos marcarán */}
      <div className="flex shrink-0 gap-1">
        <OddsButton label="Sí" value={ambos.mas} selected={selected === 'a-si'} onClick={() => pick('a-si')} />
        <OddsButton label="No" value={ambos.menos} selected={selected === 'a-no'} onClick={() => pick('a-no')} />
      </div>

      {/* Doble Oportunidad */}
      <div className="flex shrink-0 gap-1">
        <OddsButton label="1X" value={dbl.uno} selected={selected === 'd-1x'} onClick={() => pick('d-1x')} />
        <OddsButton label="12" value={dbl.x} selected={selected === 'd-12'} onClick={() => pick('d-12')} />
        <OddsButton label="X2" value={dbl.dos} selected={selected === 'd-x2'} onClick={() => pick('d-x2')} />
      </div>

      {/* Total de goles */}
      <div className="flex shrink-0 gap-1">
        <OddsButton label="Más 2.5" value={goals.mas} selected={selected === 'g-mas'} onClick={() => pick('g-mas')} />
        <OddsButton label="Men 2.5" value={goals.menos} selected={selected === 'g-men'} onClick={() => pick('g-men')} />
      </div>

      {/* Apuesta sin empate */}
      <div className="flex shrink-0 gap-1">
        <OddsButton label="1" value={sinEmpate.uno} selected={selected === 's-1'} onClick={() => pick('s-1')} />
        <OddsButton label="2" value={sinEmpate.dos} selected={selected === 's-2'} onClick={() => pick('s-2')} />
      </div>

      {/* Más apuestas */}
      <div className="shrink-0 pl-1">
        <button className="rounded bg-[#ff6b00] px-2 py-1 text-xs font-bold text-white transition hover:brightness-110">
          {masApuestas} MÁS APUESTAS
        </button>
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
          <div className="min-w-[1100px]">
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
              <div className="w-[132px] shrink-0 text-xs font-bold uppercase text-[#f5a623]">
                {COLUMNS[3]}
              </div>
              <div className="w-[152px] shrink-0 text-xs font-bold uppercase text-[#f5a623]">
                {COLUMNS[4]}
              </div>
              <div className="w-[132px] shrink-0 text-xs font-bold uppercase text-[#f5a623]">
                {COLUMNS[5]}
              </div>
              <div className="w-[132px] shrink-0 text-xs font-bold uppercase text-[#f5a623]">
                {COLUMNS[6]}
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
