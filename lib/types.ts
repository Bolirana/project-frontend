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
