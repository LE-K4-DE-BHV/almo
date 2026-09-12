import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// React Testing Library's own auto-cleanup only registers itself when it detects global test
// hooks (see test.globals in vite.config.ts - deliberately off, tests import from 'vitest'
// explicitly) - without this, a component rendered in one test stays mounted into the next,
// which is exactly the kind of thing that produces "found multiple elements" failures that have
// nothing to do with the component under test.
afterEach(() => {
  cleanup()
})
