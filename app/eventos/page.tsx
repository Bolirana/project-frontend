'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { BASE_URL, fetcher, goalsOdds, mensajeError, oddsFor, postJSON, splitTeams } from '@/lib/api'
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

type OpcionForm = { nombre: string; cuotaActual: string }

const OPCIONES_INICIALES: OpcionForm[] = [
  { nombre: 'Local', cuotaActual: '' },
  { nombre: 'Visitante', cuotaActual: '' },
]

export default function EventosPage() {
  const { data, isLoading } = useSWR<Evento[]>(`${BASE_URL}/eventos`, fetcher)
  const [open, setOpen] = useState(false)
  const [equipoLocal, setEquipoLocal] = useState('')
  const [equipoVisitante, setEquipoVisitante] = useState('')
  const [fechaEvento, setFechaEvento] = useState('')
  const [mercadoNombre, setMercadoNombre] = useState('Resultado Final')
  const [opciones, setOpciones] = useState<OpcionForm[]>(OPCIONES_INICIALES)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateOpcion(index: number, campo: keyof OpcionForm, valor: string) {
    setOpciones((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [campo]: valor } : o)),
    )
  }

  function addOpcion() {
    setOpciones((prev) => [...prev, { nombre: '', cuotaActual: '' }])
  }

  function removeOpcion(index: number) {
    setOpciones((prev) => prev.filter((_, i) => i !== index))
  }

  function resetForm() {
    setEquipoLocal('')
    setEquipoVisitante('')
    setFechaEvento('')
    setMercadoNombre('Resultado Final')
    setOpciones(OPCIONES_INICIALES)
  }

  const opcionesValidas = opciones.filter(
    (o) => o.nombre.trim() && Number(o.cuotaActual) > 1.0,
  )
  const formValido =
    equipoLocal.trim() &&
    equipoVisitante.trim() &&
    fechaEvento &&
    mercadoNombre.trim() &&
    opcionesValidas.length > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!formValido) return
    setSaving(true)
    setError('')
    try {
      await postJSON(`${BASE_URL}/eventos`, {
        equipoLocal,
        equipoVisitante,
        deporte: 'Fútbol',
        fechaEvento,
        mercados: [
          {
            nombre: mercadoNombre,
            opciones: opcionesValidas.map((o) => ({
              nombre: o.nombre,
              cuotaActual: Number(o.cuotaActual),
            })),
          },
        ],
      })
      await mutate(`${BASE_URL}/eventos`)
      setOpen(false)
      resetForm()
    } catch (err) {
      setError(mensajeError(err, 'registrar el evento'))
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
                  {formatHora(evento.fechaEvento)}
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

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setError('')
        }}
        title="Nuevo Evento"
      >
        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Equipo local">
              <input
                className={inputClass}
                placeholder="Ej: Colombia"
                value={equipoLocal}
                onChange={(e) => setEquipoLocal(e.target.value)}
              />
            </Field>
            <Field label="Equipo visitante">
              <input
                className={inputClass}
                placeholder="Ej: Brasil"
                value={equipoVisitante}
                onChange={(e) => setEquipoVisitante(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Fecha del evento">
            <input
              type="date"
              className={inputClass}
              value={fechaEvento}
              onChange={(e) => setFechaEvento(e.target.value)}
            />
          </Field>
          <Field label="Nombre del mercado">
            <input
              className={inputClass}
              placeholder="Ej: Resultado Final 1X2"
              value={mercadoNombre}
              onChange={(e) => setMercadoNombre(e.target.value)}
            />
          </Field>
          <div className="mb-3 space-y-2">
            <p className="text-xs font-bold uppercase text-[#f5a623]">
              Opciones de apuesta
            </p>
            {opciones.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="Ej: Local"
                  value={o.nombre}
                  onChange={(e) => updateOpcion(i, 'nombre', e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  className={inputClass}
                  placeholder="Cuota"
                  value={o.cuotaActual}
                  onChange={(e) =>
                    updateOpcion(i, 'cuotaActual', e.target.value)
                  }
                />
                {opciones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOpcion(i)}
                    className="shrink-0 px-2 text-xs text-[#8b9ab0] hover:text-white"
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOpcion}
              className="text-xs font-semibold text-[#00bfff] hover:underline"
            >
              + Agregar opción
            </button>
          </div>
          {error && (
            <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || !formValido}
            className={buttonGold('w-full')}
          >
            {saving ? 'Guardando...' : 'Crear Evento'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
