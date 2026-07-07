'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { BASE_URL, fetcher, formatCOP, initials, mensajeError, postJSON } from '@/lib/api'
import type { MovimientoSaldo, Usuario } from '@/lib/types'
import { Modal, Field, inputClass } from '@/components/win/modal'
import {
  EmptyState,
  FloatingAddButton,
  PageHeader,
  SkeletonRows,
  buttonGold,
} from '@/components/win/shared'
import { cn } from '@/lib/utils'

function formatFecha(fecha?: string) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MovimientosPage() {
  const { data: usuarios } = useSWR<Usuario[]>(`${BASE_URL}/usuarios`, fetcher)
  const [usuarioId, setUsuarioId] = useState<string>('')

  // When a user is selected, fetch their movimientos; otherwise all.
  const key = usuarioId
    ? `${BASE_URL}/movimientos/usuario/${usuarioId}`
    : `${BASE_URL}/movimientos`
  const { data, isLoading } = useSWR<MovimientoSaldo[]>(key, fetcher)

  const [open, setOpen] = useState(false)
  const [formUsuario, setFormUsuario] = useState('')
  const [tipo, setTipo] = useState('RECARGA')
  const [metodoPago, setMetodoPago] = useState('NEQUI')
  const [monto, setMonto] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!formUsuario) return
    setSaving(true)
    setError('')
    try {
      const usuarioId = Number(formUsuario)
      const montoNum = Number(monto)
      if (tipo === 'RECARGA') {
        await postJSON(`${BASE_URL}/movimientos/recargar`, {
          usuarioId,
          monto: montoNum,
          metodoPago,
        })
      } else {
        await postJSON(`${BASE_URL}/movimientos/retirar`, {
          usuarioId,
          monto: montoNum,
        })
      }
      await mutate(key)
      await mutate(`${BASE_URL}/usuarios`)
      setOpen(false)
      setMonto('')
    } catch (err) {
      setError(mensajeError(err, 'registrar el movimiento'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Movimientos"
        subtitle="Depósitos y retiros de saldo"
      />

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs font-bold uppercase text-[#8b9ab0]">
          Filtrar por usuario
        </span>
        <select
          className={cn(inputClass, 'max-w-xs')}
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value)}
        >
          <option value="">Todos</option>
          {usuarios?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombreCompleto}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <SkeletonRows rows={5} />}
      {!isLoading && data?.length === 0 && (
        <EmptyState message="No hay movimientos registrados" />
      )}

      <div className="space-y-2">
        {data?.map((m) => {
          const isDeposito = m.tipo === 'RECARGA'
          return (
            <div
              key={m.id}
              className={cn(
                'flex items-center gap-4 rounded-lg border-l-4 bg-[#1e2d3d] px-4 py-3',
                isDeposito
                  ? 'border-l-emerald-500'
                  : 'border-l-red-500',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  isDeposito
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400',
                )}
              >
                {isDeposito ? (
                  <ArrowDownLeft className="h-5 w-5" />
                ) : (
                  <ArrowUpRight className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {m.tipo === 'RECARGA' ? 'Depósito' : 'Retiro'}
                </p>
                <p className="truncate text-xs text-[#8b9ab0]">
                  {m.usuario.nombreCompleto} · {formatFecha(m.creadoEn)}
                </p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d1117] text-xs font-bold text-[#f5a623]">
                {initials(m.usuario.nombreCompleto)}
              </span>
              <span
                className={cn(
                  'shrink-0 text-sm font-bold',
                  isDeposito ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {isDeposito ? '+' : '-'}
                {formatCOP(m.monto)}
              </span>
            </div>
          )
        })}
      </div>

      <FloatingAddButton label="Nuevo Movimiento" onClick={() => setOpen(true)} />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setError('')
        }}
        title="Nuevo Movimiento"
      >
        <form onSubmit={submit}>
          <Field label="Usuario">
            <select
              className={inputClass}
              value={formUsuario}
              onChange={(e) => setFormUsuario(e.target.value)}
            >
              <option value="">Selecciona un usuario</option>
              {usuarios?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombreCompleto}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select
              className={inputClass}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="RECARGA">Depósito</option>
              <option value="RETIRO">Retiro</option>
            </select>
          </Field>
          {tipo === 'RECARGA' && (
            <Field label="Método de pago">
              <select
                className={inputClass}
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="NEQUI">Nequi</option>
                <option value="PSE">PSE</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </Field>
          )}
          <Field label="Monto (COP)">
            <input
              type="number"
              className={inputClass}
              placeholder="100000"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </Field>
          {error && (
            <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <button type="submit" disabled={saving} className={buttonGold('w-full')}>
            {saving ? 'Guardando...' : 'Registrar Movimiento'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
