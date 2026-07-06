'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[#8b9ab0]">{subtitle}</p>}
    </div>
  )
}

export function FloatingAddButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#f5a623] px-5 py-3 text-sm font-bold text-black shadow-lg transition hover:brightness-110"
    >
      <Plus className="h-5 w-5" />
      {label}
    </button>
  )
}

export function EmptyState({
  message = 'No hay partidos disponibles',
}: {
  message?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="text-5xl" role="img" aria-label="balón">
        ⚽
      </span>
      <p className="text-sm text-[#8b9ab0]">{message}</p>
    </div>
  )
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 w-full animate-pulse rounded-md bg-[#1e2d3d]"
        />
      ))}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  PENDIENTE: 'bg-[#f5a623]/15 text-[#f5a623]',
  REGISTRADA: 'bg-[#f5a623]/15 text-[#f5a623]',
  GANADA: 'bg-emerald-500/15 text-emerald-400',
  PERDIDA: 'bg-red-500/15 text-red-400',
  PAGADA: 'bg-[#00bfff]/15 text-[#00bfff]',
  EN_VIVO: 'bg-red-500/15 text-red-400',
  PROGRAMADO: 'bg-[#00bfff]/15 text-[#00bfff]',
  FINALIZADO: 'bg-[#8b9ab0]/15 text-[#8b9ab0]',
  DEPOSITO: 'bg-emerald-500/15 text-emerald-400',
  RETIRO: 'bg-red-500/15 text-red-400',
}

export function StatusBadge({ estado }: { estado: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
        STATUS_STYLES[estado] ?? 'bg-[#2a3f55] text-white',
      )}
    >
      {estado.replace('_', ' ')}
    </span>
  )
}

export function buttonGold(extra?: string) {
  return cn(
    'rounded bg-[#f5a623] px-4 py-2 text-sm font-bold text-black transition hover:brightness-110',
    extra,
  )
}
