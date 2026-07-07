'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { BASE_URL, del, fetcher, formatCOP, initials, patchJSON, postJSON } from '@/lib/api'
import type { Usuario } from '@/lib/types'
import { Modal, Field, inputClass } from '@/components/win/modal'
import {
  EmptyState,
  FloatingAddButton,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  buttonGold,
} from '@/components/win/shared'

export default function UsuariosPage() {
  const { data, isLoading } = useSWR<Usuario[]>(
    `${BASE_URL}/usuarios`,
    fetcher,
  )
  const [open, setOpen] = useState(false)
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actioningId, setActioningId] = useState<number | null>(null)

  async function ejecutarAccion(id: number, accion: () => Promise<unknown>) {
    setActionError('')
    setActioningId(id)
    try {
      await accion()
      await mutate(`${BASE_URL}/usuarios`)
    } catch {
      setActionError('No se pudo actualizar el usuario. Inténtalo de nuevo.')
    } finally {
      setActioningId(null)
    }
  }

  function suspenderUsuario(id: number) {
    ejecutarAccion(id, () => patchJSON(`${BASE_URL}/usuarios/${id}/suspender`))
  }

  function activarUsuario(id: number) {
    ejecutarAccion(id, () => patchJSON(`${BASE_URL}/usuarios/${id}/activar`))
  }

  function eliminarUsuario(id: number) {
    if (!window.confirm('¿Eliminar este usuario?')) return
    ejecutarAccion(id, () => del(`${BASE_URL}/usuarios/${id}`))
  }

  function closeModal() {
    setOpen(false)
    setError('')
  }

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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombreCompleto.trim() || !correo.trim() || !contrasena.trim() || !fechaNacimiento)
      return
    setError('')
    if (!esMayorDeEdad(fechaNacimiento)) {
      setError('Debes ser mayor de 18 años para registrarte')
      return
    }
    setSaving(true)
    try {
      await postJSON(`${BASE_URL}/usuarios/registro`, {
        nombreCompleto,
        correo,
        contrasena,
        fechaNacimiento,
      })
      await mutate(`${BASE_URL}/usuarios`)
      setOpen(false)
      setNombreCompleto('')
      setCorreo('')
      setContrasena('')
      setFechaNacimiento('')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('409')) {
        setError('Este correo ya está registrado.')
      } else if (message.includes('400')) {
        setError('Revisa los datos ingresados: alguno no es válido.')
      } else {
        setError('No se pudo crear el usuario. Inténtalo de nuevo.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Usuarios"
        subtitle="Administración de apostadores y saldos"
      />

      {actionError && (
        <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {actionError}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-[#2a3f55] bg-[#111827]">
        <div className="win-scroll overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[#2a3f55]">
                {['Usuario', 'Correo', 'Saldo', 'Estado', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-xs font-bold uppercase text-[#f5a623]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[#1a2a3a] transition hover:bg-[#1a2332]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5a623] text-sm font-bold text-black">
                        {initials(u.nombreCompleto)}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {u.nombreCompleto}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8b9ab0]">
                    {u.correo}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-white">
                    {formatCOP(u.saldo)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge estado={u.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.estado === 'ACTIVO' && (
                        <button
                          onClick={() => suspenderUsuario(u.id)}
                          disabled={actioningId === u.id}
                          className="rounded border border-[#f5a623] px-3 py-1 text-xs font-bold text-[#f5a623] transition hover:bg-[#f5a623]/10 disabled:opacity-50"
                        >
                          Suspender
                        </button>
                      )}
                      {u.estado === 'SUSPENDIDO' && (
                        <button
                          onClick={() => activarUsuario(u.id)}
                          disabled={actioningId === u.id}
                          className="rounded border border-emerald-500 px-3 py-1 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
                        >
                          Activar
                        </button>
                      )}
                      {u.estado !== 'ELIMINADO' && (
                        <button
                          onClick={() => eliminarUsuario(u.id)}
                          disabled={actioningId === u.id}
                          className="rounded border border-red-500 px-3 py-1 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && (
          <div className="p-3">
            <SkeletonRows rows={5} />
          </div>
        )}
        {!isLoading && data?.length === 0 && (
          <EmptyState message="No hay usuarios registrados" />
        )}
      </div>

      <FloatingAddButton label="Nuevo Usuario" onClick={() => setOpen(true)} />

      <Modal open={open} onClose={closeModal} title="Nuevo Usuario">
        <form onSubmit={submit}>
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
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              className={inputClass}
              placeholder="Mínimo 6 caracteres"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
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
          <button type="submit" disabled={saving} className={buttonGold('w-full')}>
            {saving ? 'Guardando...' : 'Crear Usuario'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
