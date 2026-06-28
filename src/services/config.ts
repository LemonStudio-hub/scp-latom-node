/**
 * Centralized API configuration.
 *
 * All service modules import from here instead of hardcoding URLs.
 * Set `VITE_API_BASE` to point at a different environment (e.g., staging).
 * `API_VERSION` is read from the VITE_API_VERSION env var at build time.
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? 'https://api.scp.lat'
export const API_VERSION: string = import.meta.env.VITE_API_VERSION ?? ''
export const API_URL = `${API_BASE}/api${API_VERSION ? `/${API_VERSION}` : ''}`
