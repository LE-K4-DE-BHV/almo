import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import * as adminApi from '../../api/admin'
import type { AdminStaff } from '../../api/admin'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/useAuth'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(iso))
}

export function AdminStaffPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<AdminStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [invited, setInvited] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .fetchAdminStaff()
      .then(setStaff)
      .finally(() => setLoading(false))
  }, [])

  // Belt-and-suspenders on top of RequireAdmin (which lets both ADMIN and STAFF into /admin/*) -
  // the backend already refuses this at /api/admin/staff/** regardless (see SecurityConfig), this
  // just avoids showing a STAFF user a page that would only error on every action.
  if (user?.role !== 'ADMIN') return <Navigate to="/admin/products" replace />

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInvited(null)
    setCreating(true)
    try {
      const created = await adminApi.createAdminStaff(email, name)
      setStaff((prev) => [created, ...prev])
      setInvited(created.email)
      setEmail('')
      setName('')
    } catch (e) {
      // Duplicate email (409, EmailAlreadyRegisteredException) is the realistic failure here.
      setError(e instanceof ApiError ? e.message : 'Failed to create staff account')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(member: AdminStaff) {
    if (!window.confirm(`Remove "${member.name}" (${member.email})? This cannot be undone.`)) return
    setError(null)
    try {
      await adminApi.deleteAdminStaff(member.id)
      setStaff((prev) => prev.filter((s) => s.id !== member.id))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to remove staff account')
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Staff</h1>

      {error && (
        <p role="alert" className="mb-4 text-sm text-brand-sale">
          {error}
        </p>
      )}
      {invited && (
        <p className="mb-4 text-sm text-brand-text-muted">
          Account created - a password-setup email was sent to {invited}.
        </p>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-6 flex flex-col gap-3 rounded border border-brand-border p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="self-start rounded bg-brand-text px-4 py-2 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Invite staff member'}
        </button>
      </form>

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-text-muted">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Since</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr key={member.id} className="border-b border-brand-border">
              <td className="py-2 pr-4">{member.name}</td>
              <td className="py-2 pr-4">{member.email}</td>
              <td className="py-2 pr-4">{formatDate(member.createdAt)}</td>
              <td className="py-2 pr-4 text-right">
                <button
                  type="button"
                  onClick={() => handleDelete(member)}
                  className="text-brand-sale underline"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {staff.length === 0 && <p className="mt-6 text-brand-text-muted">No staff accounts yet.</p>}
    </div>
  )
}
