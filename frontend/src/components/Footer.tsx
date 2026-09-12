import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { subscribeToNewsletter } from '../api/newsletter'
import { ApiError } from '../api/client'

export function Footer() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await subscribeToNewsletter(email)
      // Shown the same way whether the email was new or already subscribed - see
      // NewsletterRepository, resubscribing isn't an error worth surfacing.
      setSubscribed(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Subscription failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <footer className="border-t border-brand-border bg-brand-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            {t('footer_newsletter_title')}
          </h3>
          {subscribed ? (
            <p className="text-sm text-brand-text-muted">{t('footer_newsletter_success')}</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer_newsletter_placeholder')}
                  className="min-w-0 flex-1 rounded border border-brand-border bg-brand-bg px-3 py-1.5 text-sm outline-none focus:border-brand-accent"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="shrink-0 rounded bg-brand-text px-3 py-1.5 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
                >
                  {t('footer_newsletter_button')}
                </button>
              </div>
              {error && (
                <p role="alert" className="text-xs text-brand-sale">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            {t('footer_shop_title')}
          </h3>
          <Link to="/shop" className="block text-sm text-brand-text-muted hover:text-brand-text">
            {t('nav_shop')}
          </Link>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            {t('footer_account_title')}
          </h3>
          <Link
            to="/account"
            className="block text-sm text-brand-text-muted hover:text-brand-text"
          >
            {t('nav_account')}
          </Link>
        </div>
      </div>

      <div className="border-t border-brand-border px-6 py-4 text-center text-xs text-brand-text-muted">
        <span>{t('footer_copyright')}</span>
        {' · '}
        {/* Placeholder text only, not real links - see docs/superpowers/specs, legal pages are
            deliberately out of scope until a Gewerbe exists. */}
        <span>{t('footer_legal')}</span>
      </div>
    </footer>
  )
}
