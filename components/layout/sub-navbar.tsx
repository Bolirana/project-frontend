'use client'

import {
  Activity,
  BarChart3,
  CircleDot,
  Flame,
  Globe,
  Ticket,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { label: 'APUESTAS', icon: Ticket },
  { label: 'TODO', icon: Globe },
  { label: 'MUNDIAL', icon: Flame },
  { label: 'JUGADORES', icon: Users },
  { label: 'EN VIVO', icon: Activity },
  { label: 'FUTBOL', icon: CircleDot },
  { label: 'ESTADÍSTICAS', icon: BarChart3 },
]

export function SubNavbar() {
  const [active, setActive] = useState('FUTBOL')

  return (
    <div className="sticky top-[100px] z-30 border-b border-[#2a3f55] bg-[#111827]">
      <div className="mx-auto max-w-[1600px] px-2">
        <div className="win-scroll flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = active === cat.label
            return (
              <button
                key={cat.label}
                onClick={() => setActive(cat.label)}
                className={cn(
                  'relative flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide transition',
                  isActive
                    ? 'text-[#f5a623]'
                    : 'text-[#8b9ab0] hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#f5a623]" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
