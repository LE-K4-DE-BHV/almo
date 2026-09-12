import { useEffect, useState, type FormEvent } from 'react'
import * as adminApi from '../../api/admin'
import type { AdminCategory } from '../../api/admin'
import { ApiError } from '../../api/client'

const LANGS = ['de', 'en', 'fr'] as const

function emptyTranslations(): Record<string, string> {
  return { de: '', en: '', fr: '' }
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [key, setKey] = useState('')
  const [translations, setTranslations] = useState<Record<string, string>>(emptyTranslations())
  const [saving, setSaving] = useState(false)

  function load() {
    adminApi
      .fetchAdminCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function startCreate() {
    setEditingId(0) // 0 marks "new" - real ids start at 1
    setKey('')
    setTranslations(emptyTranslations())
    setError(null)
  }

  function startEdit(category: AdminCategory) {
    setEditingId(category.id)
    setKey(category.key)
    setTranslations({ ...emptyTranslations(), ...category.translations })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (editingId === 0) {
        const created = await adminApi.createAdminCategory({ key, translations })
        setCategories((prev) => [...prev, created])
      } else if (editingId !== null) {
        const updated = await adminApi.updateAdminCategory(editingId, { key, translations })
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      }
      setEditingId(null)
    } catch (e) {
      // Duplicate key (409, CategoryKeyTakenException) is the realistic failure here.
      setError(e instanceof ApiError ? e.message : 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category: AdminCategory) {
    if (!window.confirm(`Delete category "${category.key}"?`)) return
    setError(null)
    try {
      await adminApi.deleteAdminCategory(category.id)
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
    } catch (e) {
      // Blocked by CategoryInUseException (409) when products still reference this category.
      setError(e instanceof ApiError ? e.message : 'Failed to delete category')
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        {editingId === null && (
          <button
            type="button"
            onClick={startCreate}
            className="rounded bg-brand-text px-4 py-2 text-xs uppercase tracking-wide text-white hover:bg-black"
          >
            New category
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-brand-sale">
          {error}
        </p>
      )}

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 flex flex-col gap-3 rounded border border-brand-border p-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            Key (URL slug, e.g. "rings")
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              pattern="[a-z0-9-]+"
              className="rounded border border-brand-border px-3 py-2"
            />
          </label>
          {LANGS.map((lang) => (
            <label key={lang} className="flex flex-col gap-1 text-sm">
              Name ({lang})
              <input
                type="text"
                value={translations[lang]}
                onChange={(e) => setTranslations((prev) => ({ ...prev, [lang]: e.target.value }))}
                required={lang === 'de'}
                className="rounded border border-brand-border px-3 py-2"
              />
            </label>
          ))}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-brand-text px-4 py-2 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded border border-brand-border px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-bg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-text-muted">
            <th className="py-2 pr-4">Key</th>
            <th className="py-2 pr-4">Name (DE)</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b border-brand-border">
              <td className="py-2 pr-4">{category.key}</td>
              <td className="py-2 pr-4">{category.translations.de}</td>
              <td className="py-2 pr-4 text-right">
                <button
                  type="button"
                  onClick={() => startEdit(category)}
                  className="mr-3 text-brand-accent underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category)}
                  className="text-brand-sale underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
