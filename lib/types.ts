export type Evento = {
  id: number
  nombre: string
  deporte: string
  estado: string
  fecha?: string
}

export type Mercado = {
  id: number
  nombre: string
  descripcion: string
  evento: Evento
}

export type Usuario = {
  id: number
  nombre: string
  correo: string
  saldo: number
}

export type OpcionApuesta = {
  id: number
  cuotaActual: number
}

export type Apuesta = {
  id: number
  apostador: Usuario
  opcionApuesta: OpcionApuesta
  cuotaCongelada: number
  monto: number
  estado: string
  partido?: string
  seleccion?: string
}

export type MovimientoSaldo = {
  id: number
  usuario: Usuario
  tipo: string
  monto: number
  fecha?: string
}
