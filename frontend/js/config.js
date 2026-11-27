const BASE = new URL('.', document.baseURI).pathname
const API_CONFIGURADA = typeof globalThis.HESTIA_API_BASE === 'string'
  ? globalThis.HESTIA_API_BASE.trim().replace(/\/+$/, '')
  : ''
const API_EXTERNA = API_CONFIGURADA !== ''

export const CAMINHO_BASE = BASE
export const API_BASE = API_CONFIGURADA || `${BASE}api`
export const MODO_ESTATICO = location.hostname.endsWith('.github.io') && !API_EXTERNA

export function urlApi(rota) {
  return `${API_BASE}${rota}`
}

export function urlApp(caminho) {
  return `${BASE}${caminho}`
}
