'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-[#2a3f55] bg-[#1a2332] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2a3f55] px-5 py-4">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[#8b9ab0] transition hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#8b9ab0]">
        {label}
      </span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-md border border-[#2a3f55] bg-[#0d1117] px-3 py-2 text-sm text-white placeholder:text-[#8b9ab0] focus:border-[#f5a623] focus:outline-none'
