import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } from './tests/fixtures'

const execFileAsync = promisify(execFile)

/**
 * Runs once before the whole suite (see playwright.config.ts) - makes sure a known admin account
 * exists and is promoted, so admin-product.spec.ts can log in without every worker racing to set
 * this up itself.
 */
export default async function globalSetup() {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:8093'

  // Two-step CSRF handshake, same as every curl-based manual test in this repo's history (see
  // docs/backlog.md Sprint 5 test notes): a GET issues the XSRF-TOKEN cookie (see SecurityConfig's
  // .csrf(csrf -> csrf.spa())), which then has to be echoed back as a header on the POST.
  const csrfResponse = await fetch(`${baseURL}/api/auth/me`)
  const setCookie = csrfResponse.headers.get('set-cookie') ?? ''
  const tokenMatch = /XSRF-TOKEN=([^;]+)/.exec(setCookie)
  if (!tokenMatch) {
    throw new Error('Backend did not issue an XSRF-TOKEN cookie - is the stack running?')
  }
  const csrfToken = decodeURIComponent(tokenMatch[1])
  const cookieHeader = `XSRF-TOKEN=${tokenMatch[1]}`

  const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': csrfToken,
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NAME }),
  })

  // 409 (EmailAlreadyRegisteredException) is expected on every run after the first - the account
  // already exists from a previous local run, nothing left to do here but the role promotion below.
  if (!registerResponse.ok && registerResponse.status !== 409) {
    throw new Error(`Failed to prepare the e2e admin account: HTTP ${registerResponse.status}`)
  }

  // The role column can't be set through any API (no self-service admin signup, by design - see
  // Sprint 1 decision in docs/backlog.md), so this reaches into the database directly, the same
  // way every manual admin-promotion during development has (docker compose exec db psql ...).
  await execFileAsync('docker', [
    'compose',
    'exec',
    '-T',
    'db',
    'psql',
    '-U',
    process.env.DB_USER ?? 'almo',
    '-d',
    process.env.DB_NAME ?? 'almo',
    '-c',
    `UPDATE users SET role='ADMIN' WHERE email='${ADMIN_EMAIL}';`,
  ])
}
