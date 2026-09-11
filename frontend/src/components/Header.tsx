import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/useAuth'

const LANGUAGES = ['de', 'en', 'fr'] as const

export function Header() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    navigate(trimmed ? `/shop?search=${encodeURIComponent(trimmed)}` : '/shop')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-brand-border bg-brand-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
        <Link to="/" className="text-xl font-semibold tracking-wide">
          {t('app_title')}
        </Link>

        <nav className="flex gap-4 text-sm uppercase tracking-wide">
          <Link to="/" className="hover:text-brand-accent">
            {t('nav_home')}
          </Link>
          <Link to="/shop" className="hover:text-brand-accent">
            {t('nav_shop')}
          </Link>
        </nav>

        <form onSubmit={handleSearch} className="ml-auto min-w-40 flex-1 max-w-sm">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full rounded border border-brand-border bg-brand-bg px-3 py-1.5 text-sm outline-none focus:border-brand-accent"
          />
        </form>

        <div className="flex items-center gap-3 text-sm">
          {/* Wishlist/cart are Sprint 3 - shown as disabled placeholders so the header layout
              doesn't shift again once they land. */}
          <span aria-hidden className="text-brand-text-muted" title="Wishlist (Sprint 3)">
            ♡
          </span>
          <span aria-hidden className="text-brand-text-muted" title="Cart (Sprint 3)">
            🛍
          </span>
          <Link to={user ? '/account' : '/login'} className="hover:text-brand-accent">
            {user ? user.name : t('nav_login')}
          </Link>

          <div className="flex gap-1 border-l border-brand-border pl-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => i18n.changeLanguage(lang)}
                aria-current={i18n.language === lang}
                className={
                  i18n.language === lang
                    ? 'font-semibold text-brand-accent'
                    : 'text-brand-text-muted hover:text-brand-text'
                }
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
