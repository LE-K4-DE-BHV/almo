/** Thrown for any non-2xx API response; `message` is the backend's ApiError.message. */
export class ApiError extends Error {
  // Parameter-property shorthand (constructor(public readonly status...)) isn't allowed under
  // this project's erasableSyntaxOnly tsconfig setting, hence the explicit field + assignment.
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * Spring Security's `.spa()` CSRF setup (see backend SecurityConfig) issues an XSRF-TOKEN cookie
 * that JS can read (httpOnly=false) - it has to be echoed back as this exact header on every
 * state-changing request, or the backend rejects it with 403.
 */
function readXsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

/**
 * All API calls go through here so the CSRF header and credentials handling live in one place
 * instead of being repeated at every call site.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {}

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (method !== 'GET') {
    const token = readXsrfToken()
    if (token) headers['X-XSRF-TOKEN'] = token
  }

  const response = await fetch(path, {
    method,
    headers,
    credentials: 'same-origin', // send the session/XSRF cookies (same-origin via the Vite/nginx proxy, see vite.config.ts)
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : undefined

  if (!response.ok) {
    const message = (data as { message?: string } | undefined)?.message ?? response.statusText
    throw new ApiError(message, response.status)
  }

  return data as T
}
