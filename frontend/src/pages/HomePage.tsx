import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { fetchCategories, fetchProducts, type Category, type Product } from '../api/catalog'
import { ProductCard } from '../components/ProductCard'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<Product[]>([])

  useEffect(() => {
    fetchCategories(i18n.language).then(setCategories)
    // No "featured"/"bestseller" concept on the backend yet - just show whatever comes back
    // first from the default listing. Revisit once there's enough real catalog data (Sprint 5)
    // for that distinction to mean something.
    fetchProducts({ lang: i18n.language }).then((products) => setFeatured(products.slice(0, 4)))
  }, [i18n.language])

  return (
    <div>
      <section className="border-b border-brand-border bg-brand-surface px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">{t('home_hero_title')}</h1>
        <p className="mx-auto mt-3 max-w-md text-brand-text-muted">{t('home_hero_subtitle')}</p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded bg-brand-text px-8 py-3 text-xs uppercase tracking-wide text-white hover:bg-black"
        >
          {t('home_hero_cta')}
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-xl font-semibold">{t('home_categories_title')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.key}
              to={`/shop?category=${encodeURIComponent(category.key)}`}
              className="rounded border border-brand-border bg-brand-surface p-6 text-center hover:border-brand-accent"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-6 text-xl font-semibold">{t('shop_all_products')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
