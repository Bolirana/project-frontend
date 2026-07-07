'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { BASE_URL, fetcher, formatCOP, postJSON } from '@/lib/api'
import type { Apuesta, Evento, Usuario } from '@/lib/types'
import { Modal, Field, inputClass } from '@/components/win/modal'
import {
  EmptyState,
  FloatingAddButton,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  buttonGold,
} from '@/components/win/shared'

function nombreEvento(evento: Evento): string {
  if (evento.equipoLocal && evento.equipoVisitante) {
    return `${evento.equipoLocal} vs ${evento.equipoVisitante}`
  }
  return evento.nombre
}

export default function ApuestasPage() {
  const { data, isLoading } = useSWR<Apuesta[]>(
    `${BASE_URL}/apuestas`,
    fetcher,
  )
  const { data: usuarios } = useSWR<Usuario[]>(`${BASE_URL}/usuarios`, fetcher)
  const { data: eventos } = useSWR<Evento[]>(`${BASE_URL}/eventos`, fetcher)

  const [open, setOpen] = useState(false)
  const [usuarioId, setUsuarioId] = useState('')
  const [eventoId, setEventoId] = useState('')
  const [mercadoId, setMercadoId] = useState('')
  const [opcionId, setOpcionId] = useState('')
  const [monto, setMonto] = useState('')
  const [saving, setSaving] = useState(false)

  const eventosAbiertos = eventos?.filter((e) => e.estado === 'ABIERTO') ?? []
  const mercados =
    eventosAbiertos.find((e) => String(e.id) === eventoId)?.mercados ?? []
  const opciones =
    mercados.find((m) => String(m.id) === mercadoId)?.opciones ?? []

  function resetForm() {
    setUsuarioId('')
    setEventoId('')
    setMercadoId('')
    setOpcionId('')
    setMonto('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!usuarioId || !opcionId || !monto) return
    setSaving(true)
    try {
      await postJSON(`${BASE_URL}/apuestas`, {
        apostador: { id: Number(usuarioId) },
        opcion: { id: Number(opcionId) },
        monto: Number(monto),
      })
      await mutate(`${BASE_URL}/apuestas`)
      setOpen(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Apuestas"
        subtitle="Cupón de apuestas y su estado actual"
      />

      <div className="overflow-hidden rounded-lg border border-[#2a3f55] bg-[#111827]">
        <div className="win-scroll overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-[#2a3f55]">
                {['Partido', 'Selección', 'Cuota', 'Monto', 'Estado'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-xs font-bold uppercase text-[#f5a623]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data?.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[#1a2a3a] transition hover:bg-[#1a2332]"
                >
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {a.opcion?.mercado?.evento
                      ? nombreEvento(a.opcion.mercado.evento)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8b9ab0]">
                    {a.opcion?.nombre || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-[#00bfff]">
                    {a.cuotaCongelada.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {formatCOP(a.monto)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge estado={a.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && (
          <div className="p-3">
            <SkeletonRows rows={4} />
          </div>
        )}
        {!isLoading && data?.length === 0 && (
          <EmptyState message="No hay apuestas registradas" />
        )}
      </div>

      <FloatingAddButton label="Nueva Apuesta" onClick={() => setOpen(true)} />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          resetForm()
        }}
        title="Nueva Apuesta"
      >
        <form onSubmit={submit}>
          <Field label="Apostador">
            <select
              className={inputClass}
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
            >
              <option value="">Selecciona un usuario</option>
              {usuarios?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombreCompleto}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Evento (ABIERTO)">
            <select
              className={inputClass}
              value={eventoId}
              onChange={(e) => {
                setEventoId(e.target.value)
                setMercadoId('')
                setOpcionId('')
              }}
            >
              <option value="">Selecciona un evento</option>
              {eventosAbiertos.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {nombreEvento(ev)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mercado">
            <select
              className={inputClass}
              value={mercadoId}
              disabled={!eventoId}
              onChange={(e) => {
                setMercadoId(e.target.value)
                setOpcionId('')
              }}
            >
              <option value="">Selecciona un mercado</option>
              {mercados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Opción">
            <select
              className={inputClass}
              value={opcionId}
              disabled={!mercadoId}
              onChange={(e) => setOpcionId(e.target.value)}
            >
              <option value="">Selecciona una opción</option>
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre} (cuota {o.cuotaActual.toFixed(2)})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monto (COP)">
            <input
              type="number"
              className={inputClass}
              placeholder="50000"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            disabled={saving || !usuarioId || !opcionId || !monto}
            className={buttonGold('w-full')}
          >
            {saving ? 'Guardando...' : 'Crear Apuesta'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
