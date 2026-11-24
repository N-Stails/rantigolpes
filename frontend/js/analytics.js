import { idiomaAtual } from './i18n.js'

const CONSENT_KEY = 'hestia.analytics.consent'
const SESSION_KEY = 'hestia.analytics.session'

function criarSessao() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function obterConsentimento() {
  return localStorage.getItem(CONSENT_KEY)
}

async function enviar(payload) {
  if (obterConsentimento() !== 'accepted') return
  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hestia-Language': idiomaAtual() },
      body: JSON.stringify(payload),
      keepalive: true
    })
  } catch {
    // Analytics nunca deve interferir no funcionamento do aplicativo.
  }
}

export function iniciarAnalytics() {
  const consentimento = obterConsentimento()
  const banner = document.getElementById('bannerPrivacidade')
  const aceitar = document.getElementById('btnAceitarAnalytics')
  const recusar = document.getElementById('btnRecusarAnalytics')

  if (!consentimento) banner.hidden = false

  aceitar?.addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    banner.hidden = true
    registrarVisita()
  })

  recusar?.addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'declined')
    banner.hidden = true
  })

  if (consentimento === 'accepted') registrarVisita()
}

export function registrarVisita(pagina = 'analise') {
  if (obterConsentimento() !== 'accepted') return
  enviar({
    sessao: criarSessao(),
    tipo: 'page_view',
    pagina,
    idioma: idiomaAtual(),
    origem: document.referrer ? new URL(document.referrer, location.href).origin : null
  })
}

export function registrarEvento(tipo, pagina, detalhes = {}) {
  if (obterConsentimento() !== 'accepted') return
  enviar({
    sessao: criarSessao(),
    tipo,
    pagina,
    idioma: idiomaAtual(),
    detalhes
  })
}

export function revogarConsentimento() {
  const sessao = sessionStorage.getItem(SESSION_KEY)
  if (sessao) {
    fetch('/api/analytics/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessao }),
      keepalive: true
    }).catch(() => {})
  }
  localStorage.setItem(CONSENT_KEY, 'declined')
  sessionStorage.removeItem(SESSION_KEY)
}
