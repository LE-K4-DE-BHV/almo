/**
 * Small hand-drawn icon set, not an icon library dependency - just two icons used in a handful of
 * places (Header, ProductCard, ProductPage). Emoji (♡/🛍) render inconsistently across OS/browser
 * font stacks (size, baseline alignment, even which glyph shows up at all) - plain SVG paths look
 * the same everywhere and pick up `currentColor`, so they follow text color/hover states for free.
 */

export function HeartIcon({ filled = false, className = 'h-5 w-5' }: { filled?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.6s-7.6-4.6-10.2-9.3C.3 7.8 2.4 4.4 6.2 4.4c2.1 0 3.7 1.1 5.8 3.4 2.1-2.3 3.7-3.4 5.8-3.4 3.8 0 5.9 3.4 4.4 6.9-2.6 4.7-10.2 9.3-10.2 9.3z"
      />
    </svg>
  )
}

export function BagIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 8h11l1 12.5h-13L6.5 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  )
}
