/**
 * Centralized API configuration for the admin app.
 * Points to the same API as the main app — admin routes live at /api/admin/*.
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? 'https://api.scp.lat'
export const API_VERSION: string = import.meta.env.VITE_API_VERSION ?? ''
export const API_URL = `${API_BASE}/api${API_VERSION ? `/${API_VERSION}` : ''}`
