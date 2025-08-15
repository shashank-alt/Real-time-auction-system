// Centralized network helpers for API + WebSocket URL derivation
export const RAW_API_BASE = (import.meta.env.VITE_API_BASE ?? '/') as string
export const API_BASE = String(RAW_API_BASE).replace(/\/+$/, '') || '/'
export const api = (p: string) => `${API_BASE === '/' ? '' : API_BASE}${p}`

export function deriveWsUrl() {
  const fromEnv = import.meta.env.VITE_WS_URL as string | undefined
  if (fromEnv) return fromEnv
  try {
    if (API_BASE && /^(http|https):\/\//.test(API_BASE)) {
      const u = new URL(API_BASE)
      return (u.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + u.host
    }
  } catch {}
  if (location.port === '5173') return 'ws://localhost:8080'
  return location.origin.replace('http', 'ws')
}
export const WS_URL = deriveWsUrl()
