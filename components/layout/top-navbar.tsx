'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const UTILITY_LINKS = [
  { label: 'Cómo Empezar', href: '#' },
  { label: 'Promociones', href: '#' },
  { label: 'Centro de Ayuda', href: '#' },
]

const MAIN_TABS = [
  { label: 'DEPORTE', href: '/' },
  { label: 'CASINO', href: '#' },
  { label: 'EN VIVO', href: '#' },
]

export function TopNavbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Row 1 — utility bar */}
      <div className="bg-[#0d1117] border-b border-[#1a2a3a]">
        <div className="mx-auto flex h-9 max-w-[1600px] items-center justify-between px-4">
          <nav className="flex items-center gap-5">
            {UTILITY_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs font-medium text-[#8b9ab0] transition hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded border border-[#2a3f55] px-3 py-1 text-xs font-bold uppercase text-white transition hover:border-[#f5a623] hover:text-[#f5a623]"
            >
              Entrar
            </Link>
            <button className="rounded bg-[#f5a623] px-3 py-1 text-xs font-bold uppercase text-black transition hover:brightness-110">
              Registrarse
            </button>
          </div>
        </div>
      </div>

      {/* Row 2 — logo, tabs, search */}
      <div className="bg-[#1a2332] border-b border-[#2a3f55]">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/win24-logo.png"
              alt="WIN24"
              width={120}
              height={64}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>

          <nav className="flex h-full items-center gap-1">
            {MAIN_TABS.map((tab) => {
              const active = tab.href === '/' && pathname === '/'
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    'relative flex h-full items-center px-4 text-sm font-bold uppercase tracking-wide transition',
                    active
                      ? 'text-white'
                      : 'text-[#8b9ab0] hover:text-white',
                  )}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#f5a623]" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto hidden items-center md:flex">
            <div className="flex h-9 w-64 items-center gap-2 rounded-md border border-[#2a3f55] bg-[#0d1117] px-3">
              <Search className="h-4 w-4 text-[#8b9ab0]" />
              <input
                type="search"
                placeholder="Buscar equipo, liga..."
                className="w-full bg-transparent text-sm text-white placeholder:text-[#8b9ab0] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
