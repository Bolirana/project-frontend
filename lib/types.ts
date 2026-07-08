export type Evento = {
  id: number
  nombre: string
  deporte: string
  estado: string
  fechaEvento?: string
  equipoLocal?: string
  equipoVisitante?: string
  mercados?: Mercado[]
}

export type Mercado = {
  id: number
  nombre: string
  // Presente y completo cuando se obtiene vía GET /api/mercados; en la forma
  // anidada evento.mercados[] el backend lo colapsa a solo su id para evitar
  // referencias circulares, así que no debe asumirse siempre poblado.
  evento?: Evento
  opciones?: OpcionApuesta[]
}

export type Usuario = {
  id: number
  nombreCompleto: string
  correo: string
  saldo: number
  estado: 'ACTIVO' | 'SUSPENDIDO' | 'ELIMINADO'
  rol: 'ADMINISTRADOR' | 'APOSTADOR'
}

export type OpcionApuesta = {
  id: number
  nombre: string
  cuotaActual: number
  // Mismo caso que Mercado.evento: completo solo cuando esta opción es el
  // punto de entrada del árbol serializado (ej. Apuesta.opcion.mercado).
  mercado?: Mercado
}

export type Apuesta = {
  id: number
  apostador: Usuario
  opcion: OpcionApuesta
  cuotaCongelada: number
  monto: number
  estado: string
}

export type MovimientoSaldo = {
  id: number
  usuario: Usuario
  tipo: string
  monto: number
  creadoEn?: string
}

// RF-14: sugerencia de ajuste de cuota para una opción cuya exposición superó el límite.
export type SugerenciaCuota = {
  cuotaActual: number
  cuotaSugerida: number
  razon: string
} | null

// RF-12/RF-13: exposición económica de una opción y su estado de alerta de riesgo.
export type ExposicionOpcion = {
  opcionId: number
  nombreOpcion: string
  cuotaActual: number
  exposicion: number
  limiteAlerta: number
  alerta: boolean
  sugerencia: SugerenciaCuota
}

export type ExposicionMercado = {
  mercadoId: number
  nombreMercado: string
  opciones: ExposicionOpcion[]
}

// Respuesta de GET /api/riesgo/exposicion/{eventoId}
export type ExposicionEvento = {
  eventoId: number
  nombreEvento: string
  mercados: ExposicionMercado[]
}

// RF-22: Respuesta de GET /api/apuestas/usuario/{id}
export type HistorialApostador = {
  saldo: number
  apuestas: Apuesta[]
  movimientos: MovimientoSaldo[]
}

// RF-04: Evento externo de TheSportsDB, vía
// GET /api/integracion-deportiva/sportsdb/equipos/{id}/proximos-eventos
// Los campos usan los nombres originales de TheSportsDB (idEvent, strHomeTeam...)
// porque los DTO del backend anotan @JsonProperty con esos nombres para poder
// deserializar la respuesta externa, y esa misma anotación se aplica también
// al serializar la respuesta hacia este frontend.
export type EventoExternoSportsDb = {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strSport: string
  dateEvent: string
  strTime?: string
}

// RF-04: Cuotas de referencia de The Odds API, vía
// GET /api/integracion-deportiva/odds/{sportKey}. Mismo caso: nombres de
// campo originales de la API externa (home_team, sport_key...).
export type OutcomeOdds = { name: string; price: number }
export type MarketOdds = { key: string; outcomes: OutcomeOdds[] }
export type BookmakerOdds = { key: string; title: string; markets: MarketOdds[] }
export type EventoOdds = {
  id: string
  sport_key: string
  home_team: string
  away_team: string
  commence_time: string
  bookmakers: BookmakerOdds[]
}
