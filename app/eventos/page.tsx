'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { BASE_URL, fetcher, goalsOdds, mensajeError, oddsFor, patchJSON, postJSON, splitTeams } from '@/lib/api'
import type { Evento, EventoExternoSportsDb, EventoOdds, OutcomeOdds } from '@/lib/types'
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

function normalizar(s: string) {
  return s.trim().toLowerCase()
}

// RF-04: mercado h2h del primer bookmaker devuelto, usado solo como guía.
function outcomesDe(evento: EventoOdds | null): OutcomeOdds[] {
  if (!evento?.bookmakers?.length) return []
  const bm = evento.bookmakers[0]
  const market = bm.markets?.find((m) => m.key === 'h2h') ?? bm.markets?.[0]
  return market?.outcomes ?? []
}

// Empareja el nombre de una opción del formulario (ej. "Local", "Empate",
// o el nombre real de un equipo) contra las cuotas de referencia externas.
function sugerenciaPara(
  nombreOpcion: string,
  equipoLocal: string,
  equipoVisitante: string,
  outcomes: OutcomeOdds[],
): number | null {
  if (!outcomes.length) return null
  const n = normalizar(nombreOpcion)
  let objetivo: string | null = null
  if (n === normalizar(equipoLocal) || n === 'local' || n === '1') objetivo = equipoLocal
  else if (n === normalizar(equipoVisitante) || n === 'visitante' || n === '2')
    objetivo = equipoVisitante
  else if (n === 'empate' || n === 'draw' || n === 'x') objetivo = 'draw'

  if (!objetivo) return null
  const match = outcomes.find(
    (o) => normalizar(o.name) === normalizar(objetivo!) || normalizar(o.name) === 'draw' && objetivo === 'draw',
  )
  return match ? match.price : null
}

export default function EventosPage() {
  const { data, isLoading } = useSWR<Evento[]>(`${BASE_URL}/eventos`, fetcher)
  const [open, setOpen] = useState(false)
  const [equipoLocal, setEquipoLocal] = useState('')
  const [equipoVisitante, setEquipoVisitante] = useState('')
  const [deporte, setDeporte] = useState('Fútbol')
  const [fechaEvento, setFechaEvento] = useState('')
  const [mercadoNombre, setMercadoNombre] = useState('Resultado Final')
  const [opciones, setOpciones] = useState<OpcionForm[]>(OPCIONES_INICIALES)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // RF-04: búsqueda de equipo en TheSportsDB para autocompletar el formulario.
  const [idEquipoBusqueda, setIdEquipoBusqueda] = useState('')
  const [buscandoEquipo, setBuscandoEquipo] = useState(false)
  const [errorEquipo, setErrorEquipo] = useState('')
  const [eventosExternos, setEventosExternos] = useState<EventoExternoSportsDb[] | null>(null)

  // RF-04: cuotas de referencia de The Odds API, solo como guía visual.
  const [sportKey, setSportKey] = useState('soccer_epl')
  const [buscandoOdds, setBuscandoOdds] = useState(false)
  const [errorOdds, setErrorOdds] = useState('')
  const [oddsResultados, setOddsResultados] = useState<EventoOdds[] | null>(null)
  const [oddsSeleccionadoId, setOddsSeleccionadoId] = useState('')

  const [accionError, setAccionError] = useState('')
  const [accionandoId, setAccionandoId] = useState<number | null>(null)

  const [liquidarEvento, setLiquidarEvento] = useState<Evento | null>(null)
  const [opcionGanadoraId, setOpcionGanadoraId] = useState('')
  const [liquidando, setLiquidando] = useState(false)
  const [liquidarErrorMsg, setLiquidarErrorMsg] = useState('')

  async function cambiarEstado(id: number, nuevoEstado: string) {
    setAccionError('')
    setAccionandoId(id)
    try {
      await patchJSON(`${BASE_URL}/eventos/${id}/estado?nuevoEstado=${nuevoEstado}`)
      await mutate(`${BASE_URL}/eventos`)
    } catch (err) {
      setAccionError(mensajeError(err, 'actualizar el evento'))
    } finally {
      setAccionandoId(null)
    }
  }

  function abrirEvento(id: number) {
    cambiarEstado(id, 'ABIERTO')
  }

  function cerrarEvento(id: number) {
    cambiarEstado(id, 'CERRADO')
  }

  function cancelarEvento(id: number) {
    if (!window.confirm('¿Cancelar este evento? Esta acción no se puede deshacer.')) return
    cambiarEstado(id, 'CANCELADO')
  }

  function abrirModalLiquidar(evento: Evento) {
    setLiquidarEvento(evento)
    setOpcionGanadoraId('')
    setLiquidarErrorMsg('')
  }

  function cerrarModalLiquidar() {
    setLiquidarEvento(null)
    setOpcionGanadoraId('')
    setLiquidarErrorMsg('')
  }

  async function confirmarLiquidacion(e: React.FormEvent) {
    e.preventDefault()
    if (!liquidarEvento || !opcionGanadoraId) return
    setLiquidando(true)
    setLiquidarErrorMsg('')
    try {
      await postJSON(`${BASE_URL}/apuestas/liquidar`, {
        eventoId: liquidarEvento.id,
        opcionGanadoraId: Number(opcionGanadoraId),
      })
      await mutate(`${BASE_URL}/eventos`)
      await mutate(`${BASE_URL}/apuestas`)
      cerrarModalLiquidar()
    } catch (err) {
      setLiquidarErrorMsg(mensajeError(err, 'liquidar el evento'))
    } finally {
      setLiquidando(false)
    }
  }

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
    setDeporte('Fútbol')
    setFechaEvento('')
    setMercadoNombre('Resultado Final')
    setOpciones(OPCIONES_INICIALES)
    setIdEquipoBusqueda('')
    setErrorEquipo('')
    setEventosExternos(null)
    setOddsResultados(null)
    setOddsSeleccionadoId('')
    setErrorOdds('')
  }

  async function buscarEquipo() {
    if (!idEquipoBusqueda.trim()) return
    setBuscandoEquipo(true)
    setErrorEquipo('')
    setEventosExternos(null)
    try {
      const data = await fetcher<{ events: EventoExternoSportsDb[] | null }>(
        `${BASE_URL}/integracion-deportiva/sportsdb/equipos/${idEquipoBusqueda.trim()}/proximos-eventos`,
      )
      setEventosExternos(data.events ?? [])
    } catch (err) {
      setErrorEquipo(mensajeError(err, 'buscar los eventos del equipo'))
    } finally {
      setBuscandoEquipo(false)
    }
  }

  function seleccionarEventoExterno(ev: EventoExternoSportsDb) {
    setEquipoLocal(ev.strHomeTeam ?? '')
    setEquipoVisitante(ev.strAwayTeam ?? '')
    if (ev.strSport) setDeporte(ev.strSport)
    if (ev.dateEvent) setFechaEvento(ev.dateEvent)
  }

  async function buscarOdds() {
    if (!sportKey.trim()) return
    setBuscandoOdds(true)
    setErrorOdds('')
    setOddsResultados(null)
    setOddsSeleccionadoId('')
    try {
      const data = await fetcher<EventoOdds[]>(`${BASE_URL}/integracion-deportiva/odds/${sportKey.trim()}`)
      setOddsResultados(data ?? [])
    } catch (err) {
      setErrorOdds(mensajeError(err, 'consultar las cuotas de referencia'))
    } finally {
      setBuscandoOdds(false)
    }
  }

  const eventoOddsCoincidente =
    oddsResultados?.find(
      (o) => normalizar(o.home_team) === normalizar(equipoLocal) && normalizar(o.away_team) === normalizar(equipoVisitante),
    ) ?? null
  const eventoOddsActivo =
    eventoOddsCoincidente ?? oddsResultados?.find((o) => o.id === oddsSeleccionadoId) ?? null
  const outcomesReferencia = outcomesDe(eventoOddsActivo)

  const opcionesValidas = opciones.filter(
    (o) => o.nombre.trim() && Number(o.cuotaActual) > 1.0,
  )
  const formValido =
    equipoLocal.trim() &&
    equipoVisitante.trim() &&
    deporte.trim() &&
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
        deporte,
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

      {accionError && (
        <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {accionError}
        </p>
      )}

      {isLoading && <SkeletonRows rows={6} />}
      {!isLoading && data?.length === 0 && <EmptyState />}

      <div className="space-y-2">
        {data?.map((evento) => {
          const [home, away] = splitTeams(evento.nombre)
          const odds = oddsFor(evento.id)
          const goals = goalsOdds(evento.id)
          const enAccion = accionandoId === evento.id
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
              <div className="flex shrink-0 items-center gap-2">
                {evento.estado === 'CREADO' && (
                  <>
                    <button
                      onClick={() => abrirEvento(evento.id)}
                      disabled={enAccion}
                      className="rounded border border-emerald-500 px-3 py-1 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => cancelarEvento(evento.id)}
                      disabled={enAccion}
                      className="rounded border border-red-500 px-3 py-1 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {evento.estado === 'ABIERTO' && (
                  <>
                    <button
                      onClick={() => cerrarEvento(evento.id)}
                      disabled={enAccion}
                      className="rounded border border-[#f5a623] px-3 py-1 text-xs font-bold text-[#f5a623] transition hover:bg-[#f5a623]/10 disabled:opacity-50"
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={() => cancelarEvento(evento.id)}
                      disabled={enAccion}
                      className="rounded border border-red-500 px-3 py-1 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {evento.estado === 'CERRADO' && (
                  <button
                    onClick={() => abrirModalLiquidar(evento)}
                    className={buttonGold('px-3 py-1 text-xs')}
                  >
                    Liquidar
                  </button>
                )}
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
          <div className="mb-4 space-y-3 rounded-md border border-[#2a3f55] bg-[#0d1117] p-3">
            <p className="text-xs font-bold uppercase text-[#00bfff]">
              RF-04 · Datos externos (opcional)
            </p>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="ID de equipo (TheSportsDB)">
                  <input
                    className={inputClass}
                    placeholder="Ej: 133604"
                    value={idEquipoBusqueda}
                    onChange={(e) => setIdEquipoBusqueda(e.target.value)}
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={buscarEquipo}
                disabled={buscandoEquipo || !idEquipoBusqueda.trim()}
                className="mb-4 shrink-0 rounded border border-[#2a3f55] px-3 py-2 text-xs font-bold uppercase text-white transition hover:border-[#00bfff] hover:text-[#00bfff] disabled:opacity-50"
              >
                {buscandoEquipo ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {errorEquipo && <p className="text-xs text-red-400">{errorEquipo}</p>}
            {eventosExternos && eventosExternos.length === 0 && (
              <p className="text-xs text-[#8b9ab0]">Sin próximos eventos para ese equipo.</p>
            )}
            {eventosExternos && eventosExternos.length > 0 && (
              <Field label="Próximos eventos encontrados">
                <select
                  className={inputClass}
                  defaultValue=""
                  onChange={(e) => {
                    const ev = eventosExternos.find((x) => x.idEvent === e.target.value)
                    if (ev) seleccionarEventoExterno(ev)
                  }}
                >
                  <option value="" disabled>
                    Selecciona un evento para autocompletar
                  </option>
                  {eventosExternos.map((ev) => (
                    <option key={ev.idEvent} value={ev.idEvent}>
                      {ev.strEvent} — {ev.dateEvent}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Sport key (The Odds API)">
                  <input
                    className={inputClass}
                    placeholder="Ej: soccer_epl"
                    value={sportKey}
                    onChange={(e) => setSportKey(e.target.value)}
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={buscarOdds}
                disabled={buscandoOdds || !sportKey.trim()}
                className="mb-4 shrink-0 rounded border border-[#2a3f55] px-3 py-2 text-xs font-bold uppercase text-white transition hover:border-[#00bfff] hover:text-[#00bfff] disabled:opacity-50"
              >
                {buscandoOdds ? 'Buscando...' : 'Ver cuotas'}
              </button>
            </div>
            {errorOdds && <p className="text-xs text-red-400">{errorOdds}</p>}
            {oddsResultados && oddsResultados.length === 0 && (
              <p className="text-xs text-[#8b9ab0]">Sin cuotas de referencia para ese sport key.</p>
            )}
            {oddsResultados && oddsResultados.length > 0 && !eventoOddsCoincidente && (
              <Field label="Evento de referencia (sin match automático por nombre de equipo)">
                <select
                  className={inputClass}
                  value={oddsSeleccionadoId}
                  onChange={(e) => setOddsSeleccionadoId(e.target.value)}
                >
                  <option value="">Ninguno</option>
                  {oddsResultados.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.home_team} vs {o.away_team}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {eventoOddsActivo && (
              <p className="text-xs text-[#8b9ab0]">
                Cuotas de referencia cargadas para {eventoOddsActivo.home_team} vs{' '}
                {eventoOddsActivo.away_team}. Se muestran como sugerencia junto a cada opción.
              </p>
            )}
          </div>

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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deporte">
              <input
                className={inputClass}
                placeholder="Ej: Fútbol"
                value={deporte}
                onChange={(e) => setDeporte(e.target.value)}
              />
            </Field>
            <Field label="Fecha del evento">
              <input
                type="date"
                className={inputClass}
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
              />
            </Field>
          </div>
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
            {opciones.map((o, i) => {
              const sugerida = sugerenciaPara(o.nombre, equipoLocal, equipoVisitante, outcomesReferencia)
              return (
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
                  {sugerida != null && (
                    <button
                      type="button"
                      title="Usar cuota de referencia"
                      onClick={() => updateOpcion(i, 'cuotaActual', sugerida.toFixed(2))}
                      className="shrink-0 rounded border border-[#00bfff]/40 px-2 py-1 text-[11px] font-semibold text-[#00bfff] transition hover:bg-[#00bfff]/10"
                    >
                      Ref: {sugerida.toFixed(2)}
                    </button>
                  )}
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
              )
            })}
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

      <Modal
        open={liquidarEvento !== null}
        onClose={cerrarModalLiquidar}
        title={`Liquidar evento: ${liquidarEvento?.nombre ?? ''}`}
      >
        <form onSubmit={confirmarLiquidacion}>
          <Field label="Opción ganadora">
            <select
              className={inputClass}
              value={opcionGanadoraId}
              onChange={(e) => setOpcionGanadoraId(e.target.value)}
            >
              <option value="">Selecciona la opción ganadora</option>
              {liquidarEvento?.mercados?.map((m) => (
                <optgroup key={m.id} label={m.nombre}>
                  {m.opciones?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          {liquidarErrorMsg && (
            <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {liquidarErrorMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={liquidando || !opcionGanadoraId}
            className={buttonGold('w-full')}
          >
            {liquidando ? 'Liquidando...' : 'Liquidar'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
