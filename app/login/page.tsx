'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BASE_URL, mensajeError, postJSON } from '@/lib/api'
import type { Usuario } from '@/lib/types'
import { Field, inputClass } from '@/components/win/modal'
import { PageHeader, buttonGold } from '@/components/win/shared'

export default function LoginPage() {
  const router = useRouter()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!correo.trim() || !contrasena.trim()) return
    setSaving(true)
    setError('')
    try {
      const usuario = await postJSON<Usuario>(`${BASE_URL}/auth/login`, {
        correo,
        contrasena,
      })
      localStorage.setItem('usuario', JSON.stringify(usuario))
      router.push('/')
    } catch (err) {
      setError(mensajeError(err, 'iniciar sesión'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <PageHeader
        title="Iniciar sesión"
        subtitle="Ingresa con tu correo y contraseña"
      />

      <div className="rounded-lg border border-[#2a3f55] bg-[#1e2d3d] p-5">
        <form onSubmit={submit}>
          <Field label="Correo">
            <input
              type="email"
              className={inputClass}
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              className={inputClass}
              placeholder="Tu contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </Field>
          {error && (
            <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || !correo.trim() || !contrasena.trim()}
            className={buttonGold('w-full')}
          >
            {saving ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
