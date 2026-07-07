'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { ArrowDownLeft, ArrowUpRight, Dices, Trophy, type LucideIcon } from 'lucide-react'
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

type EstiloMovimiento = {
  label: string
  icon: LucideIcon
  signo: '+' | '-'
  border: string
  bg: string
  text: string
}

const ESTILOS_MOVIMIENTO: Record<string, EstiloMovimiento> = {
  RECARGA: {
    label: 'Depósito',
    icon: ArrowDownLeft,
    signo: '+',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
  },
  RETIRO: {
    label: 'Retiro',
    icon: ArrowUpRight,
    signo: '-',
    border: 'border-l-red-500',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
  },
  APUESTA: {
    label: 'Apuesta',
    icon: Dices,
    signo: '-',
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
  },
  PAGO_APUESTA: {
    label: 'Ganancia',
    icon: Trophy,
    signo: '+',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
  },
}

const ESTILO_DEFECTO: EstiloMovimiento = {
  label: 'Movimiento',
  icon: ArrowUpRight,
  signo: '-',
  border: 'border-l-[#2a3f55]',
  bg: 'bg-[#2a3f55]/40',
  text: 'text-[#8b9ab0]',
}

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
  const [cuentaDestino, setCuentaDestino] = useState('')
  const [monto, setMonto] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!formUsuario) return
    if (tipo === 'RETIRO' && !cuentaDestino.trim()) return
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
          metodoPago,
        })
      }
      await mutate(key)
      await mutate(`${BASE_URL}/usuarios`)
      setOpen(false)
      setMonto('')
      setCuentaDestino('')
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
          const estilo = ESTILOS_MOVIMIENTO[m.tipo] ?? ESTILO_DEFECTO
          const Icono = estilo.icon
          return (
            <div
              key={m.id}
              className={cn(
                'flex items-center gap-4 rounded-lg border-l-4 bg-[#1e2d3d] px-4 py-3',
                estilo.border,
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  estilo.bg,
                  estilo.text,
                )}
              >
                <Icono className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {estilo.label}
                </p>
                <p className="truncate text-xs text-[#8b9ab0]">
                  {m.usuario.nombreCompleto} · {formatFecha(m.creadoEn)}
                </p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d1117] text-xs font-bold text-[#f5a623]">
                {initials(m.usuario.nombreCompleto)}
              </span>
              <span className={cn('shrink-0 text-sm font-bold', estilo.text)}>
                {estilo.signo}
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
          setCuentaDestino('')
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
              onChange={(e) => {
                const nuevoTipo = e.target.value
                setTipo(nuevoTipo)
                if (nuevoTipo === 'RETIRO' && metodoPago !== 'NEQUI') {
                  setMetodoPago('NEQUI')
                }
              }}
            >
              <option value="RECARGA">Depósito</option>
              <option value="RETIRO">Retiro</option>
            </select>
          </Field>
          <Field label={tipo === 'RECARGA' ? 'Método de pago' : 'Método de retiro'}>
            <select
              className={inputClass}
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
            >
              <option value="NEQUI">Nequi</option>
              {tipo === 'RECARGA' && <option value="PSE">PSE</option>}
              {tipo === 'RECARGA' && <option value="TARJETA">Tarjeta</option>}
            </select>
          </Field>
          {tipo === 'RETIRO' && (
            <Field label="Número de cuenta / celular">
              <input
                className={inputClass}
                placeholder="Ej: 3001234567"
                value={cuentaDestino}
                onChange={(e) => setCuentaDestino(e.target.value)}
              />
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
          <button
            type="submit"
            disabled={saving || (tipo === 'RETIRO' && !cuentaDestino.trim())}
            className={buttonGold('w-full')}
          >
            {saving ? 'Guardando...' : 'Registrar Movimiento'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
