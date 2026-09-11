/**
 * Per-browser only, never sent to the backend - matches the old
 * almofrontenddesign/js/recently-viewed.js approach. Not account data, so localStorage is the
 * right place for it (see CLAUDE.md guidance on what belongs in browser storage).
 */
const STORAGE_KEY = 'almo_recently_viewed'
const MAX_ITEMS = 8

export function recordView(productId: number) {
  const ids = getRecentlyViewed().filter((id) => id !== productId)
  ids.unshift(productId)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ITEMS)))
  } catch {
    // Private browsing / storage disabled - not viewing this feature is not worth erroring over.
  }
}

export function getRecentlyViewed(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}
