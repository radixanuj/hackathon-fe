const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`

const TOKEN_KEY = 'radix.token'

export const token = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (value) => localStorage.setItem(TOKEN_KEY, value),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** Thrown for any non-2xx response. `errors` is Laravel's 422 field map. */
export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  /** First message for a field, for inline form errors. */
  fieldError(field) {
    return this.errors?.[field]?.[0]
  }
}

function query(params) {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.append(key, value === true ? '1' : String(value))
  }
  const string = search.toString()
  return string ? `?${string}` : ''
}

async function request(method, path, { body, params, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const bearer = auth ? token.get() : null
  if (bearer) headers.Authorization = `Bearer ${bearer}`

  const response = await fetch(`${BASE}${path}${query(params)}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    // An expired or revoked token should drop us back to sign-in rather than
    // leaving every screen stuck on an error.
    if (response.status === 401 && bearer) {
      token.clear()
      window.dispatchEvent(new Event('radix:unauthorized'))
    }
    throw new ApiError(
      response.status,
      payload?.message || `Request failed (${response.status})`,
      payload?.errors,
    )
  }

  return payload
}

export const http = {
  get: (path, params, options) => request('GET', path, { params, ...options }),
  post: (path, body, options) => request('POST', path, { body, ...options }),
  patch: (path, body, options) => request('PATCH', path, { body, ...options }),
  put: (path, body, options) => request('PUT', path, { body, ...options }),
  delete: (path, body, options) => request('DELETE', path, { body, ...options }),
}

/** Unwrap `{ data }`. */
export const unwrap = (payload) => payload?.data

/** Unwrap a paginated list into `{ items, meta }`. */
export const unwrapList = (payload) => ({
  items: payload?.data ?? [],
  meta: payload?.meta ?? null,
})
