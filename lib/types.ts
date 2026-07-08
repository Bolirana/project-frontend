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
