'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BASE_URL, mensajeError, postJSON } from '@/lib/api'
import type { Usuario } from '@/lib/types'
import { Field, inputClass } from '@/components/win/modal'
import { PageHeader, buttonGold } from '@/components/win/shared'

type Modo = 'login' | 'registro'

function esMayorDeEdad(fecha: string): boolean {
  const nacimiento = new Date(fecha)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const noHaCumplidoAnosEsteAno =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())
  if (noHaCumplidoAnosEsteAno) edad--
  return edad >= 18
}

function LoginRegistroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [modo, setModo] = useState<Modo>(
    searchParams.get('modo') === 'registro' ? 'registro' : 'login',
  )
  const esLogin = modo === 'login'

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [correoRegistro, setCorreoRegistro] = useState('')
  const [contrasenaRegistro, setContrasenaRegistro] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function cambiarModo(nuevoModo: Modo) {
    setModo(nuevoModo)
    setError('')
  }

  function iniciarSesionYRedirigir(usuario: Usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario))
    router.push('/')
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!correo.trim() || !contrasena.trim()) return
    setSaving(true)
    setError('')
    try {
      const usuario = await postJSON<Usuario>(`${BASE_URL}/auth/login`, {
        correo,
        contrasena,
      })
      iniciarSesionYRedirigir(usuario)
    } catch (err) {
      setError(mensajeError(err, 'iniciar sesión'))
    } finally {
      setSaving(false)
    }
  }

  async function submitRegistro(e: React.FormEvent) {
    e.preventDefault()
    if (
      !nombreCompleto.trim() ||
      !correoRegistro.trim() ||
      !contrasenaRegistro.trim() ||
      !fechaNacimiento
    )
      return
    setError('')
    if (!esMayorDeEdad(fechaNacimiento)) {
      setError('Debes ser mayor de 18 años para registrarte')
      return
    }
    setSaving(true)
    try {
      const usuario = await postJSON<Usuario>(`${BASE_URL}/usuarios/registro`, {
        nombreCompleto,
        correo: correoRegistro,
        contrasena: contrasenaRegistro,
        fechaNacimiento,
      })
      iniciarSesionYRedirigir(usuario)
    } catch (err) {
      setError(mensajeError(err, 'registrar el usuario'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <PageHeader
        title={esLogin ? 'Iniciar sesión' : 'Crear cuenta'}
        subtitle={
          esLogin
            ? 'Ingresa con tu correo y contraseña'
            : 'Regístrate para empezar a apostar'
        }
      />

      <div className="rounded-lg border border-[#2a3f55] bg-[#1e2d3d] p-5">
        {esLogin ? (
          <form onSubmit={submitLogin}>
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
        ) : (
          <form onSubmit={submitRegistro}>
            <Field label="Nombre completo">
              <input
                className={inputClass}
                placeholder="Ej: Carlos Ramírez"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
              />
            </Field>
            <Field label="Correo">
              <input
                type="email"
                className={inputClass}
                placeholder="correo@ejemplo.com"
                value={correoRegistro}
                onChange={(e) => setCorreoRegistro(e.target.value)}
              />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
                value={contrasenaRegistro}
                onChange={(e) => setContrasenaRegistro(e.target.value)}
              />
            </Field>
            <Field label="Fecha de nacimiento">
              <input
                type="date"
                className={inputClass}
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
              />
            </Field>
            {error && (
              <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={
                saving ||
                !nombreCompleto.trim() ||
                !correoRegistro.trim() ||
                !contrasenaRegistro.trim() ||
                !fechaNacimiento
              }
              className={buttonGold('w-full')}
            >
              {saving ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-[#8b9ab0]">
          {esLogin ? (
            <>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => cambiarModo('registro')}
                className="font-bold text-[#f5a623] hover:underline"
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className="font-bold text-[#f5a623] hover:underline"
              >
                Inicia sesión
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginRegistroForm />
    </Suspense>
  )
}
