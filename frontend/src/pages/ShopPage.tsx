import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { fetchCategories, fetchProducts, type Category, type Product } from '../api/catalog'
import { ProductCard } from '../components/ProductCard'

const METAL_COLORS = ['gold', 'silver', 'rose_gold', 'bicolor']
const AVAILABILITY_OPTIONS = ['in_stock', 'low_stock', 'out_of_stock']
const SORT_OPTIONS = ['price-asc', 'price-desc', 'name', 'rating']

/**
 * Filters live in the URL (search params), not component state alone - mirrors the old
 * almofrontenddesign/shop.html (category/search were query-string driven there too), and means a
 * filtered shop URL is bookmarkable/shareable instead of resetting on reload.
 */
export function ShopPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const category = searchParams.get('category') ?? ''
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''
  const metalColor = searchParams.get('metalColor') ?? ''
  const availability = searchParams.get('availability') ?? ''
  const search = searchParams.get('search') ?? ''
  const sort = searchParams.get('sort') ?? ''

  useEffect(() => {
    fetchCategories(i18n.language).then(setCategories)
  }, [i18n.language])

  useEffect(() => {
    setLoading(true)
    fetchProducts({
      lang: i18n.language,
      category: category || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      metalColor: metalColor || undefined,
      availability: availability || undefined,
      search: search || undefined,
      sort: sort || undefined,
    })
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [i18n.language, category, minPrice, maxPrice, metalColor, availability, search, sort])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  function resetFilters() {
    setSearchParams(search ? { search } : {})
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">
        {search ? `"${search}"` : t('shop_all_products')}
      </h1>

      <div className="flex flex-col gap-8 sm:flex-row">
        <aside className="flex shrink-0 flex-col gap-6 sm:w-56">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
              {t('shop_filter_category')}
            </h2>
            <select
              value={category}
              onChange={(e) => updateParam('category', e.target.value)}
              className="w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm"
            >
              <option value="">{t('shop_all_categories')}</option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
              {t('shop_filter_price')}
            </h2>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                placeholder={t('shop_filter_price_min')}
                value={minPrice}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                className="w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder={t('shop_filter_price_max')}
                value={maxPrice}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                className="w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
              {t('shop_filter_metal')}
            </h2>
            <select
              value={metalColor}
              onChange={(e) => updateParam('metalColor', e.target.value)}
              className="w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm"
            >
              <option value="">{t('shop_filter_any')}</option>
              {METAL_COLORS.map((m) => (
                <option key={m} value={m}>
                  {t(`metal_${m}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
              {t('shop_filter_availability')}
            </h2>
            <select
              value={availability}
              onChange={(e) => updateParam('availability', e.target.value)}
              className="w-full rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm"
            >
              <option value="">{t('shop_filter_any')}</option>
              {AVAILABILITY_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {t(`stock_${a}`)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-left text-xs uppercase tracking-wide text-brand-text-muted underline hover:text-brand-text"
          >
            {t('shop_filter_reset')}
          </button>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-brand-text-muted">
              {t('shop_results_count', { count: products.length })}
            </span>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm"
            >
              <option value="">{t('shop_sort_default')}</option>
              {SORT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {t(`shop_sort_${s.replace('-', '_')}`)}
                </option>
              ))}
            </select>
          </div>

          {!loading && products.length === 0 && (
            <p className="text-brand-text-muted">{t('shop_no_products')}</p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
