'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const PAISES = [
  { label: 'Colombia', flag: '🇨🇴' },
  { label: 'México', flag: '🇲🇽' },
  { label: 'Brasil', flag: '🇧🇷' },
  { label: 'Argentina', flag: '🇦🇷' },
  { label: 'España', flag: '🇪🇸' },
  { label: 'Inglaterra', flag: '🏴' },
  { label: 'Italia', flag: '🇮🇹' },
  { label: 'Francia', flag: '🇫🇷' },
  { label: 'Alemania', flag: '🇩🇪' },
]

export function Paises() {
  const [active, setActive] = useState('Colombia')
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-white">Especial Países</h2>
      <div className="win-scroll flex gap-2 overflow-x-auto pb-2">
        {PAISES.map((p) => {
          const isActive = active === p.label
          return (
            <button
              key={p.label}
              onClick={() => setActive(p.label)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                isActive
                  ? 'border-[#f5a623] bg-[#f5a623] text-black'
                  : 'border-[#2a3f55] bg-[#1e2d3d] text-white hover:border-[#f5a623]',
              )}
            >
              <span aria-hidden>{p.flag}</span>
              {p.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
