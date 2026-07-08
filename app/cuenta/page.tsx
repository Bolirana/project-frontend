'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { BASE_URL, fetcher, formatCOP } from '@/lib/api'
import type { Evento, HistorialApostador, Usuario } from '@/lib/types'
import { EmptyState, PageHeader, SkeletonRows, StatusBadge } from '@/components/win/shared'
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
    </div>
  )
}
