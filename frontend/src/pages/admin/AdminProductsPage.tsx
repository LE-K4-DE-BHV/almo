import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import * as adminApi from '../../api/admin'
import type { AdminCategory, AdminProduct } from '../../api/admin'
import { ApiError } from '../../api/client'

function formatPrice(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([adminApi.fetchAdminProducts(), adminApi.fetchAdminCategories()])
      .then(([productList, categoryList]) => {
        setProducts(productList)
        setCategories(categoryList)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(product: AdminProduct) {
    const name = product.translations.de?.name ?? `#${product.id}`
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setError(null)
    try {
      await adminApi.deleteAdminProduct(product.id)
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
    } catch (e) {
      // Blocked by ProductHasOrdersException (409) when the product is referenced by an order -
      // deliberately not cascaded on the backend, see docs/backlog.md Sprint 5 decisions.
      setError(e instanceof ApiError ? e.message : 'Failed to delete product')
    }
  }

  function categoryName(categoryId: number) {
    return categories.find((c) => c.id === categoryId)?.translations.de ?? `#${categoryId}`
  }

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Link
          to="/admin/products/new"
          className="rounded bg-brand-text px-4 py-2 text-xs uppercase tracking-wide text-white hover:bg-black"
        >
          New product
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-brand-sale">
          {error}
        </p>
      )}

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-text-muted">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Category</th>
            <th className="py-2 pr-4">Price</th>
            <th className="py-2 pr-4">Stock</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-brand-border">
              <td className="py-2 pr-4">{product.translations.de?.name ?? `#${product.id}`}</td>
              <td className="py-2 pr-4">{categoryName(product.categoryId)}</td>
              <td className="py-2 pr-4">{formatPrice(product.price)}</td>
              <td className="py-2 pr-4">{product.stockQuantity}</td>
              <td className="py-2 pr-4">{product.status}</td>
              <td className="py-2 pr-4 text-right">
                <Link
                  to={`/admin/products/${product.id}`}
                  className="mr-3 text-brand-accent underline"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(product)}
                  className="text-brand-sale underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && <p className="mt-6 text-brand-text-muted">No products yet.</p>}
    </div>
  )
}
