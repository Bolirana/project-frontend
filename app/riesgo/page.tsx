'use client'

import { Fragment, useState } from 'react'
import useSWR from 'swr'
import { BASE_URL, fetcher, formatCOP } from '@/lib/api'
import type { Evento, ExposicionEvento } from '@/lib/types'
import { Field, inputClass } from '@/components/win/modal'
import { EmptyState, PageHeader, SkeletonRows } from '@/components/win/shared'
import { cn } from '@/lib/utils'

export default function RiesgoPage() {
  const { data: eventos } = useSWR<Evento[]>(`${BASE_URL}/eventos`, fetcher)
  const [eventoId, setEventoId] = useState('')

  const key = eventoId ? `${BASE_URL}/riesgo/exposicion/${eventoId}` : null
  const { data: exposicion, isLoading } = useSWR<ExposicionEvento>(key, fetcher)

  return (
    <div className="p-4">
      <PageHeader
        title="Motor de Riesgo"
        subtitle="Exposición económica por opción y alertas de riesgo"
      />

      <div className="mb-4 max-w-sm">
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
      </div>

      {!eventoId && (
        <EmptyState message="Selecciona un evento para ver su exposición" />
      )}
      {eventoId && isLoading && <SkeletonRows rows={4} />}

      {exposicion && (
        <div className="space-y-6">
          {exposicion.mercados.map((mercado) => (
            <div
              key={mercado.mercadoId}
              className="overflow-hidden rounded-lg border border-[#2a3f55] bg-[#111827]"
            >
              <div className="border-b border-[#2a3f55] px-4 py-2">
                <p className="text-xs font-bold uppercase text-[#f5a623]">
                  {mercado.nombreMercado}
                </p>
              </div>
              <div className="win-scroll overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-[#2a3f55]">
                      {['Opción', 'Cuota', 'Exposición', 'Límite', 'Alerta'].map(
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
                    {mercado.opciones.map((o) => (
                      <Fragment key={o.opcionId}>
                        <tr
                          className={cn(
                            'border-b border-[#1a2a3a]',
                            o.alerta && 'bg-red-500/10',
                          )}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-white">
                            {o.nombreOpcion}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#00bfff]">
                            {o.cuotaActual.toFixed(2)}
                          </td>
                          <td
                            className={cn(
                              'px-4 py-3 text-sm font-bold',
                              o.alerta ? 'text-red-400' : 'text-white',
                            )}
                          >
                            {formatCOP(o.exposicion)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#8b9ab0]">
                            {formatCOP(o.limiteAlerta)}
                          </td>
                          <td className="px-4 py-3">
                            {o.alerta ? (
                              <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs font-bold uppercase text-red-400">
                                Alerta
                              </span>
                            ) : (
                              <span className="text-xs text-[#8b9ab0]">—</span>
                            )}
                          </td>
                        </tr>
                        {o.alerta && o.sugerencia && (
                          <tr className="border-b border-[#1a2a3a] bg-red-500/5">
                            <td colSpan={5} className="px-4 py-3 text-xs text-[#8b9ab0]">
                              <span className="font-bold text-red-400">
                                Sugerencia:
                              </span>{' '}
                              cuota actual {o.sugerencia.cuotaActual.toFixed(2)} →
                              sugerida{' '}
                              <span className="font-bold text-emerald-400">
                                {o.sugerencia.cuotaSugerida.toFixed(2)}
                              </span>
                              {' — '}
                              {o.sugerencia.razon}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
