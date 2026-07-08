'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import { BASE_URL, fetcher, formatCOP, mensajeError, postJSON } from '@/lib/api'
import type { Evento, HistorialApostador, Usuario } from '@/lib/types'
import { Field, inputClass, Modal } from '@/components/win/modal'
import {
  EmptyState,
  FloatingAddButton,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  buttonGold,
} from '@/components/win/shared'
import { cn } from '@/lib/utils'

const TIPO_LABELS: Record<string, string> = {
  RECARGA: 'Depósito',
  RETIRO: 'Retiro',
  APUESTA: 'Apuesta',
  PAGO_APUESTA: 'Ganancia',
}

function nombreEvento(evento?: Partial<Evento>): string {
  if (!evento) return '—'
  if (evento.equipoLocal && evento.equipoVisitante) {
    return `${evento.equipoLocal} vs ${evento.equipoVisitante}`
  }
  return evento.nombre ?? '—'
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

export default function CuentaPage() {
  const router = useRouter()
  const [usuarioId, setUsuarioId] = useState<number | null>(null)

  useEffect(() => {
    const guardado = localStorage.getItem('usuario')
    if (!guardado) {
      router.push('/login')
      return
    }
    try {
      const usuario: Usuario = JSON.parse(guardado)
      setUsuarioId(usuario.id)
    } catch {
      localStorage.removeItem('usuario')
      router.push('/login')
    }
  }, [router])

  const key = usuarioId ? `${BASE_URL}/apuestas/usuario/${usuarioId}` : null
  const { data, isLoading } = useSWR<HistorialApostador>(key, fetcher)

  const { data: eventos } = useSWR<Evento[]>(`${BASE_URL}/eventos`, fetcher)

  const [openApuesta, setOpenApuesta] = useState(false)
  const [eventoId, setEventoId] = useState('')
  const [mercadoId, setMercadoId] = useState('')
  const [opcionId, setOpcionId] = useState('')
  const [monto, setMonto] = useState('')
  const [savingApuesta, setSavingApuesta] = useState(false)
  const [errorApuesta, setErrorApuesta] = useState('')

  const eventosAbiertos = eventos?.filter((e) => e.estado === 'ABIERTO') ?? []
  const mercados =
    eventosAbiertos.find((e) => String(e.id) === eventoId)?.mercados ?? []
  const opciones =
    mercados.find((m) => String(m.id) === mercadoId)?.opciones ?? []

  function resetFormApuesta() {
    setEventoId('')
    setMercadoId('')
    setOpcionId('')
    setMonto('')
  }

  function cerrarModalApuesta() {
    setOpenApuesta(false)
    resetFormApuesta()
    setErrorApuesta('')
  }

  async function submitApuesta(e: React.FormEvent) {
    e.preventDefault()
    if (!usuarioId || !opcionId || !monto) return
    setSavingApuesta(true)
    setErrorApuesta('')
    try {
      await postJSON(`${BASE_URL}/apuestas`, {
        apostador: { id: usuarioId },
        opcion: { id: Number(opcionId) },
        monto: Number(monto),
      })
      await mutate(key)
      setOpenApuesta(false)
      resetFormApuesta()
    } catch (err) {
      setErrorApuesta(mensajeError(err, 'registrar la apuesta'))
    } finally {
      setSavingApuesta(false)
    }
  }

  return (
    <div className="p-4">
      <PageHeader title="Mi Cuenta" subtitle="Tu saldo, apuestas y movimientos" />

      {(!usuarioId || isLoading) && <SkeletonRows rows={4} />}

      {data && (
        <>
          <div className="mb-6 rounded-lg border border-[#2a3f55] bg-[#1e2d3d] p-5">
            <p className="text-xs font-bold uppercase text-[#8b9ab0]">
              Saldo disponible
            </p>
            <p className="mt-1 text-3xl font-bold text-[#f5a623]">
              {formatCOP(data.saldo)}
            </p>
          </div>

          <p className="mb-2 text-xs font-bold uppercase text-[#f5a623]">
            Mis apuestas
          </p>
          <div className="mb-6 overflow-hidden rounded-lg border border-[#2a3f55] bg-[#111827]">
            <div className="win-scroll overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-[#2a3f55]">
                    {['Partido', 'Selección', 'Cuota', 'Monto', 'Estado'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-2 text-xs font-bold uppercase text-[#8b9ab0]"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.apuestas.map((a) => (
                    <tr key={a.id} className="border-b border-[#1a2a3a]">
                      <td className="px-4 py-3 text-sm font-medium text-white">
                        {nombreEvento(a.opcion?.mercado?.evento)}
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
            {data.apuestas.length === 0 && (
              <EmptyState message="No has hecho apuestas todavía" />
            )}
          </div>

          <p className="mb-2 text-xs font-bold uppercase text-[#f5a623]">
            Mis movimientos
          </p>
          <div className="overflow-hidden rounded-lg border border-[#2a3f55] bg-[#111827]">
            <div className="win-scroll overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b border-[#2a3f55]">
                    {['Tipo', 'Monto', 'Fecha'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-xs font-bold uppercase text-[#8b9ab0]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.movimientos.map((m) => {
                    const esIngreso =
                      m.tipo === 'RECARGA' || m.tipo === 'PAGO_APUESTA'
                    return (
                      <tr key={m.id} className="border-b border-[#1a2a3a]">
                        <td className="px-4 py-3 text-sm font-medium text-white">
                          {TIPO_LABELS[m.tipo] ?? m.tipo}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-sm font-bold',
                            esIngreso ? 'text-emerald-400' : 'text-red-400',
                          )}
                        >
                          {esIngreso ? '+' : '-'}
                          {formatCOP(m.monto)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#8b9ab0]">
                          {formatFecha(m.creadoEn)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {data.movimientos.length === 0 && (
              <EmptyState message="No hay movimientos registrados" />
            )}
          </div>
        </>
      )}

      {usuarioId && (
        <>
          <FloatingAddButton
            label="Nueva Apuesta"
            onClick={() => setOpenApuesta(true)}
          />

          <Modal
            open={openApuesta}
            onClose={cerrarModalApuesta}
            title="Nueva Apuesta"
          >
            <form onSubmit={submitApuesta}>
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
              {errorApuesta && (
                <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {errorApuesta}
                </p>
              )}
              <button
                type="submit"
                disabled={savingApuesta || !opcionId || !monto}
                className={buttonGold('w-full')}
              >
                {savingApuesta ? 'Guardando...' : 'Crear Apuesta'}
              </button>
            </form>
          </Modal>
        </>
      )}
    </div>
  )
}
