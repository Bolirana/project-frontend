'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { BASE_URL, fetcher, goalsOdds, oddsFor, postJSON, splitTeams } from '@/lib/api'
import type { Evento } from '@/lib/types'
import { Modal, Field, inputClass } from '@/components/win/modal'
import { OddsButton } from '@/components/win/odds-button'
import {
  EmptyState,
  FloatingAddButton,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  buttonGold,
} from '@/components/win/shared'

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

export default function EventosPage() {
  const { data, isLoading } = useSWR<Evento[]>(`${BASE_URL}/eventos`, fetcher)
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState('PROGRAMADO')
  const [fecha, setFecha] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    try {
      await postJSON(`${BASE_URL}/eventos`, {
        nombre,
        deporte: 'Fútbol',
        estado,
        fecha: fecha || new Date().toISOString(),
      })
      await mutate(`${BASE_URL}/eventos`)
      setOpen(false)
      setNombre('')
      setFecha('')
      setEstado('PROGRAMADO')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Eventos"
        subtitle="Partidos de fútbol disponibles para apostar"
      />

      {isLoading && <SkeletonRows rows={6} />}
      {!isLoading && data?.length === 0 && <EmptyState />}

      <div className="space-y-2">
        {data?.map((evento) => {
          const [home, away] = splitTeams(evento.nombre)
          const odds = oddsFor(evento.id)
          const goals = goalsOdds(evento.id)
          return (
            <div
              key={evento.id}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-[#2a3f55] bg-[#1e2d3d] px-4 py-3"
            >
              <div className="w-32 shrink-0">
                <StatusBadge estado={evento.estado} />
                <p className="mt-1 text-xs text-[#8b9ab0]">
                  {formatHora(evento.fecha)}
                </p>
              </div>
              <div className="min-w-[180px] flex-1">
                <p className="text-sm font-semibold text-white">{home}</p>
                <p className="text-sm font-semibold text-white">
                  {away || '—'}
                </p>
              </div>
              <div className="flex gap-1">
                <OddsButton label="1" value={odds.uno} />
                <OddsButton label="X" value={odds.x} />
                <OddsButton label="2" value={odds.dos} />
              </div>
              <div className="flex gap-1">
                <OddsButton label="Más 2.5" value={goals.mas} />
                <OddsButton label="Men 2.5" value={goals.menos} />
              </div>
            </div>
          )
        })}
      </div>

      <FloatingAddButton label="Nuevo Evento" onClick={() => setOpen(true)} />

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Evento">
        <form onSubmit={submit}>
          <Field label="Nombre del partido">
            <input
              className={inputClass}
              placeholder="Ej: Colombia vs Brasil"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </Field>
          <Field label="Estado">
            <select
              className={inputClass}
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="PROGRAMADO">Programado</option>
              <option value="EN_VIVO">En vivo</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </Field>
          <Field label="Fecha y hora">
            <input
              type="datetime-local"
              className={inputClass}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Field>
          <button type="submit" disabled={saving} className={buttonGold('w-full')}>
            {saving ? 'Guardando...' : 'Crear Evento'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
