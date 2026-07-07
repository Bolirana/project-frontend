'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { BASE_URL, fetcher, postJSON } from '@/lib/api'
import type { Evento, Mercado } from '@/lib/types'
import { Modal, Field, inputClass } from '@/components/win/modal'
import {
  EmptyState,
  FloatingAddButton,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  buttonGold,
} from '@/components/win/shared'

export default function MercadosPage() {
  const { data, isLoading } = useSWR<Mercado[]>(
    `${BASE_URL}/mercados`,
    fetcher,
  )
  const { data: eventos } = useSWR<Evento[]>(`${BASE_URL}/eventos`, fetcher)

  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [eventoId, setEventoId] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !eventoId) return
    setSaving(true)
    try {
      await postJSON(`${BASE_URL}/mercados`, {
        nombre,
        evento: { id: Number(eventoId) },
      })
      await mutate(`${BASE_URL}/mercados`)
      setOpen(false)
      setNombre('')
      setEventoId('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Mercados"
        subtitle="Tipos de mercado disponibles por evento"
      />

      {isLoading && <SkeletonRows rows={6} />}
      {!isLoading && data?.length === 0 && (
        <EmptyState message="No hay mercados disponibles" />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-[#2a3f55] bg-[#1e2d3d] p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-white text-balance">
                {m.nombre}
              </h3>
              <StatusBadge estado={m.evento?.estado ?? ''} />
            </div>
            <div className="mt-1 border-t border-[#2a3f55] pt-2">
              <p className="text-[11px] font-bold uppercase text-[#f5a623]">
                Evento
              </p>
              <p className="text-sm text-white">{m.evento?.nombre ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      <FloatingAddButton label="Nuevo Mercado" onClick={() => setOpen(true)} />

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Mercado">
        <form onSubmit={submit}>
          <Field label="Nombre del mercado">
            <input
              className={inputClass}
              placeholder="Ej: Resultado Final 1X2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </Field>
          <Field label="Evento">
            <select
              className={inputClass}
              value={eventoId}
              onChange={(e) => setEventoId(e.target.value)}
            >
              <option value="">Selecciona un evento</option>
              {eventos?.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre}
                </option>
              ))}
            </select>
          </Field>
          <button type="submit" disabled={saving} className={buttonGold('w-full')}>
            {saving ? 'Guardando...' : 'Crear Mercado'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
