import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import * as adminApi from '../../api/admin'
import type { AdminCategory, AdminProductRequest, ProductTranslation } from '../../api/admin'
import { ApiError } from '../../api/client'

const LANGS = ['de', 'en', 'fr'] as const
const METAL_COLORS = ['gold', 'silver', 'rose_gold', 'bicolor']

const emptyTranslation: ProductTranslation = { name: '', description: '', details: [] }

function emptyTranslations(): Record<string, ProductTranslation> {
  return { de: { ...emptyTranslation }, en: { ...emptyTranslation }, fr: { ...emptyTranslation } }
}

/** Textarea holds one detail bullet per line - joined/split on save/load rather than a dynamic
    list of inputs, since product details are short (3-6 bullets) and this is simpler to edit. */
function detailsToText(details: string[]) {
  return details.join('\n')
}

function textToDetails(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function AdminProductFormPage() {
  const { id } = useParams()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [price, setPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('0')
  const [metalColor, setMetalColor] = useState('')
  const [badge, setBadge] = useState('')
  const [translations, setTranslations] = useState<Record<string, ProductTranslation>>(
    emptyTranslations(),
  )
  const [imageRefs, setImageRefs] = useState<string[]>([])
  const [activeLang, setActiveLang] = useState<(typeof LANGS)[number]>('de')
  const [loading, setLoading] = useState(isEdit)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi.fetchAdminCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (!isEdit) return
    adminApi.fetchAdminProduct(Number(id)).then((product) => {
      setCategoryId(product.categoryId)
      setPrice(String(product.price))
      setCompareAtPrice(product.compareAtPrice !== null ? String(product.compareAtPrice) : '')
      setStockQuantity(String(product.stockQuantity))
      setMetalColor(product.metalColor ?? '')
      setBadge(product.badge ?? '')
      setImageRefs(product.imageRefs)
      setTranslations({ ...emptyTranslations(), ...product.translations })
      setLoading(false)
    })
  }, [id, isEdit])

  function updateTranslation(lang: string, field: keyof ProductTranslation, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: field === 'details' ? textToDetails(value) : value,
      },
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (categoryId === '') {
      setError('Please select a category')
      return
    }

    const body: AdminProductRequest = {
      categoryId,
      price: Number(price),
      compareAtPrice: compareAtPrice === '' ? null : Number(compareAtPrice),
      stockQuantity: Number(stockQuantity),
      metalColor: metalColor || null,
      badge: badge || null,
      translations,
    }

    setSaving(true)
    try {
      const saved = isEdit
        ? await adminApi.updateAdminProduct(Number(id), body)
        : await adminApi.createAdminProduct(body)
      navigate(`/admin/products/${saved.id}`, { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(file: File) {
    if (!isEdit) return // new product needs to be saved first to have an id to attach images to
    setError(null)
    setUploading(true)
    try {
      const updated = await adminApi.uploadProductImage(Number(id), file)
      setImageRefs(updated.imageRefs)
    } catch (e) {
      // 503 when CLOUDINARY_URL isn't configured (see ImageUploadNotConfiguredException) -
      // shown as-is, it's a deployment issue, not something retrying fixes.
      setError(e instanceof ApiError ? e.message : 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleImageRemove(url: string) {
    if (!isEdit) return
    setError(null)
    try {
      const updated = await adminApi.removeProductImage(Number(id), url)
      setImageRefs(updated.imageRefs)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to remove image')
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold">{isEdit ? 'Edit product' : 'New product'}</h1>

      {error && (
        <p role="alert" className="mb-4 text-sm text-brand-sale">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Category
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="rounded border border-brand-border px-3 py-2"
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.translations.de ?? c.key}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Metal / color
            <select
              value={metalColor}
              onChange={(e) => setMetalColor(e.target.value)}
              className="rounded border border-brand-border px-3 py-2"
            >
              <option value="">-</option>
              {METAL_COLORS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Price (EUR)
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="rounded border border-brand-border px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Compare-at price (optional)
            <input
              type="number"
              step="0.01"
              min="0"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              className="rounded border border-brand-border px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Stock quantity
            <input
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              required
              className="rounded border border-brand-border px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Badge (optional, e.g. "New")
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="rounded border border-brand-border px-3 py-2"
            />
          </label>
        </div>

        <div>
          <div className="mb-3 flex gap-1 border-b border-brand-border">
            {LANGS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`px-4 py-2 text-sm uppercase tracking-wide ${
                  activeLang === lang
                    ? 'border-b-2 border-brand-text font-semibold'
                    : 'text-brand-text-muted'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Name
              <input
                type="text"
                value={translations[activeLang].name}
                onChange={(e) => updateTranslation(activeLang, 'name', e.target.value)}
                required={activeLang === 'de'}
                className="rounded border border-brand-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Description
              <textarea
                value={translations[activeLang].description}
                onChange={(e) => updateTranslation(activeLang, 'description', e.target.value)}
                rows={4}
                className="rounded border border-brand-border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Details (one per line)
              <textarea
                value={detailsToText(translations[activeLang].details)}
                onChange={(e) => updateTranslation(activeLang, 'details', e.target.value)}
                rows={4}
                className="rounded border border-brand-border px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold">Images</h2>
          {!isEdit && (
            <p className="mb-2 text-sm text-brand-text-muted">
              Save the product first to be able to upload images.
            </p>
          )}
          {isEdit && (
            <>
              <div className="mb-3 flex flex-wrap gap-3">
                {imageRefs.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="h-24 w-24 rounded border border-brand-border object-cover" />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(url)}
                      className="absolute -right-2 -top-2 rounded-full bg-brand-sale px-2 py-0.5 text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleImageUpload(file)
                  e.target.value = ''
                }}
              />
              {uploading && <p className="mt-1 text-sm text-brand-text-muted">Uploading…</p>}
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-brand-text px-6 py-3 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="rounded border border-brand-border px-6 py-3 text-xs uppercase tracking-wide hover:bg-brand-bg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
