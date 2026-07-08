'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { useEffect, useState } from 'react'
import {
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  LayoutGrid,
  Radio,
  Receipt,
  Search,
  ShieldAlert,
  Star,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react'
import { BASE_URL, fetcher, splitTeams } from '@/lib/api'
import type { Evento, Usuario } from '@/lib/types'
import { cn } from '@/lib/utils'

// Para APOSTADOR, "MIS APUESTAS" se reemplaza por "MI CUENTA" (RF-22):
// ADMINISTRADOR ya tiene /apuestas completo en Gestión, así que ese
// primer ítem solo cambia para el rol que de verdad necesita /cuenta.
function construirPopular(rol: Usuario['rol'] | undefined) {
  const primerItem =
    rol === 'APOSTADOR'
      ? { label: 'MI CUENTA', icon: Wallet, href: '/cuenta' }
      : { label: 'MIS APUESTAS', icon: Receipt, href: '/apuestas' }

  return [
    primerItem,
    { label: 'DESTACADOS', icon: Star, href: '/' },
    { label: 'EN VIVO AHORA', icon: Radio, href: '/' },
    { label: 'COMENZANDO PRONTO', icon: CalendarClock, href: '/' },
  ]
}

const GESTION = [
  { label: 'EVENTOS', icon: Trophy, href: '/eventos' },
  { label: 'APUESTAS', icon: Receipt, href: '/apuestas' },
  { label: 'USUARIOS', icon: Users, href: '/usuarios' },
  { label: 'MERCADOS', icon: LayoutGrid, href: '/mercados' },
  { label: 'MOVIMIENTOS', icon: CircleDollarSign, href: '/movimientos' },
  { label: 'RIESGO', icon: ShieldAlert, href: '/riesgo' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-[#8b9ab0]">
      {children}
    </p>
  )
}

function EventoItem({ evento }: { evento: Evento }) {
  const [open, setOpen] = useState(false)
  const [home, away] = splitTeams(evento.nombre)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-white transition hover:bg-[#1a2332]"
      >
        <span className="truncate">
          {home}
          {away && <span className="text-[#8b9ab0]"> vs {away}</span>}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[#8b9ab0] transition',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="ml-4 border-l border-[#2a3f55] pb-1">
          <button className="block w-full py-1 pl-4 text-left text-xs text-[#8b9ab0] transition hover:text-white">
            DATOS Y RESULTADOS
          </button>
          <button className="block w-full py-1 pl-4 text-left text-xs text-[#8b9ab0] transition hover:text-white">
            APUESTAS DE JUGADORES
          </button>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: eventos, isLoading } = useSWR<Evento[]>(
    `${BASE_URL}/eventos`,
    fetcher,
  )

  // Igual que TopNavbar: se relee en cada cambio de ruta porque este
  // componente no se remonta entre navegaciones client-side.
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  useEffect(() => {
    const guardado = localStorage.getItem('usuario')
    if (!guardado) {
      setUsuario(null)
      return
    }
    try {
      setUsuario(JSON.parse(guardado))
    } catch {
      localStorage.removeItem('usuario')
      setUsuario(null)
    }
  }, [pathname])

  const esAdministrador = usuario?.rol === 'ADMINISTRADOR'
  const popularItems = construirPopular(usuario?.rol)

  return (
    <aside className="win-scroll hidden w-[280px] shrink-0 overflow-y-auto border-r border-[#2a3f55] bg-[#111827] lg:block">
      <div className="p-3">
        <div className="flex h-9 items-center gap-2 rounded-md border border-[#2a3f55] bg-[#0d1117] px-3">
          <Search className="h-4 w-4 text-[#8b9ab0]" />
          <input
            placeholder="Buscar..."
            className="w-full bg-transparent text-sm text-white placeholder:text-[#8b9ab0] focus:outline-none"
          />
        </div>
      </div>

      <SectionTitle>Popular</SectionTitle>
      <nav>
        {popularItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-[#1a2332]"
            >
              <Icon className="h-4 w-4 text-[#8b9ab0]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {esAdministrador && (
        <>
          <SectionTitle>Gestión</SectionTitle>
          <nav>
            {GESTION.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 border-l-2 px-4 py-2 text-sm font-medium uppercase tracking-wide transition',
                    active
                      ? 'border-[#f5a623] bg-[#1a2332] text-white'
                      : 'border-transparent text-white hover:bg-[#1a2332]',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      active ? 'text-[#f5a623]' : 'text-[#8b9ab0]',
                    )}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </>
      )}

      <SectionTitle>Eventos</SectionTitle>
      <div className="pb-6">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-2">
              <div className="h-4 w-40 animate-pulse rounded bg-[#1e2d3d]" />
            </div>
          ))}
        {eventos?.map((e) => (
          <EventoItem key={e.id} evento={e} />
        ))}
      </div>
    </aside>
  )
}
