'use client'

import { cn } from '@/lib/utils'

export function OddsButton({
  label,
  value,
  selected,
  onClick,
}: {
  label?: string
  value: string
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-10 w-16 flex-col items-center justify-center rounded-sm border text-sm font-bold transition',
        selected
          ? 'border-[#f5a623] bg-[#f5a623] text-black'
          : 'border-[#2a3f55] bg-[#1e2d3d] text-white hover:bg-[#f5a623] hover:text-black',
      )}
    >
      {label && (
        <span
          className={cn(
            'text-[10px] font-medium uppercase leading-none',
            selected ? 'text-black/70' : 'text-[#8b9ab0]',
          )}
        >
          {label}
        </span>
      )}
      <span className="leading-tight">{value}</span>
    </button>
  )
}
