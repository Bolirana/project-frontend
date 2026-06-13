'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { BASE_URL, fetcher, formatCOP, postJSON } from '@/lib/api'
import type { Apuesta, Usuario } from '@/lib/types'
import { Modal, Field, inputClass } from '@/components/win/modal'
import {
  EmptyState,
  FloatingAddButton,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  buttonGold,
} from '@/components/win/shared'

export default function ApuestasPage() {
  const { data, isLoading } = useSWR<Apuesta[]>(
    `${BASE_URL}/apuestas`,
    fetcher,
  )
  const { data: usuarios } = useSWR<Usuario[]>(`${BASE_URL}/usuarios`, fetcher)

  const [open, setOpen] = useState(false)
  const [partido, setPartido] = useState('')
  const [seleccion, setSeleccion] = useState('')
  const [cuota, setCuota] = useState('1.50')
  const [monto, setMonto] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await postJSON(`${BASE_URL}/apuestas`, {
        partido,
        seleccion,
        cuota: Number(cuota),
        monto: Number(monto),
        usuarioId: usuarioId ? Number(usuarioId) : undefined,
        estado: 'PENDIENTE',
      })
      await mutate(`${BASE_URL}/apuestas`)
      setOpen(false)
      setPartido('')
      setSeleccion('')
      setCuota('1.50')
      setMonto('')
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
                    {a.partido || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8b9ab0]">
                    {a.seleccion || '—'}
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

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva Apuesta">
        <form onSubmit={submit}>
          <Field label="Partido">
            <input
              className={inputClass}
              placeholder="Ej: Colombia vs Brasil"
              value={partido}
              onChange={(e) => setPartido(e.target.value)}
            />
          </Field>
          <Field label="Selección">
            <input
              className={inputClass}
              placeholder="Ej: Colombia (1)"
              value={seleccion}
              onChange={(e) => setSeleccion(e.target.value)}
            />
          </Field>
          <Field label="Apostador">
            <select
              className={inputClass}
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
            >
              <option value="">Selecciona un usuario</option>
              {usuarios?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cuota">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={cuota}
                onChange={(e) => setCuota(e.target.value)}
              />
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
          </div>
          <button type="submit" disabled={saving} className={buttonGold('w-full')}>
            {saving ? 'Guardando...' : 'Crear Apuesta'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
