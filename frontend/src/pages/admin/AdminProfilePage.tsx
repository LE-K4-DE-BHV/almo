import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../api/client'

export function AdminProfilePage() {
  const { user, updateProfile } = useAuth()
  const [email, setEmail] = useState(user?.email ?? '')
  const [name, setName] = useState(user?.name ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!user) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      await updateProfile(email, name, newPassword)
      setNewPassword('')
      setSaved(true)
    } catch (e) {
      // Duplicate email (409, EmailAlreadyRegisteredException) is the realistic failure here -
      // same exception the register flow throws.
      setError(e instanceof ApiError ? e.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-xl font-semibold">Profile</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-brand-border p-4">
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
        <label className="flex flex-col gap-1 text-sm">
          New password (leave blank to keep current)
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-brand-sale">
            {error}
          </p>
        )}
        {saved && <p className="text-sm text-brand-text-muted">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded bg-brand-text px-4 py-2 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
