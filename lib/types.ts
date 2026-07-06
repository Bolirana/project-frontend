export type Evento = {
  id: number
  nombre: string
  deporte: string
  estado: string
  fechaEvento?: string
  equipoLocal?: string
  equipoVisitante?: string
}

export type Mercado = {
  id: number
  nombre: string
  evento: Evento
}

export type Usuario = {
  id: number
  nombreCompleto: string
  correo: string
  saldo: number
}

export type OpcionApuesta = {
  id: number
  nombre: string
  cuotaActual: number
  mercado: Mercado
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
