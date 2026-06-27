/**
 * Centralized API configuration.
 *
 * All service modules import from here instead of hardcoding URLs.
 * Change `API_BASE` to point at a different environment (e.g., staging).
 */
export const API_BASE = 'https://api.scp.lat'
export const API_VERSION = 'v1'
export const API_URL = `${API_BASE}/api/${API_VERSION}`
