// Héstia — Alerta Cidadão. Ponto de entrada do frontend.
import { iniciarAnalise } from './analise.js'
import { iniciarAlertas } from './alertas.js'
import { iniciarGuia } from './guia.js'
import { pararFala } from './voz.js'
import { aplicarIdioma, idiomaAtual, t } from './i18n.js'
import { iniciarAnalytics, registrarVisita, registrarEvento, revogarConsentimento } from './analytics.js'

// Chamada genérica à API (mesmo domínio, servida pelo Express)
async function api(rota, opcoes = {}) {
  const cabecalho = new Headers(opcoes.headers || {})
  cabecalho.set('Accept-Language', idiomaAtual())
  const resposta = await fetch(`/api${rota}`, { ...opcoes, headers: cabecalho })
  const dados = await resposta.json().catch(() => ({ sucesso: false }))
  if (!resposta.ok) return dados
  return dados
}

// Toast de feedback (sucesso/erro/info)
function exibirMensagem(mensagem, tipo = 'info') {
  let toast = document.getElementById('toast')
  toast.textContent = mensagem
  toast.className = `toast toast-${tipo}`
  toast.hidden = false
  clearTimeout(exibirMensagem._tempo)
  exibirMensagem._tempo = setTimeout(() => { toast.hidden = true }, 5000)
}

// NAVEGAÇÃO POR ABAS (SPA-like, sem recarregar página)
const ORDEM_ABAS = ['analise', 'alertas', 'guia', 'sobre']

function iniciarNavegacao() {
  const botoes = document.querySelectorAll('[data-aba]')
  botoes.forEach((botao) => {
    botao.addEventListener('click', () => ativarAba(botao.dataset.aba))
  })
}

function ativarAba(nome) {
  pararFala()

  document.querySelectorAll('[data-aba]').forEach((b) => {
    const ativa = b.dataset.aba === nome
    b.classList.toggle('ativa', ativa)
    b.setAttribute('aria-selected', String(ativa))
  })

  document.querySelectorAll('[data-secao]').forEach((secao) => {
    secao.hidden = secao.id !== `aba-${nome}`
  })

  registrarVisita(nome)
  registrarEvento('tab_change', nome)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ACESSIBILIDADE: tamanho de fonte (RNF1)
const NIVEIS_FONTE = ['normal', 'grande', 'extra']

function aumentarFonte() {
  mudarFonte(+1)
}

function diminuirFonte() {
  mudarFonte(-1)
}

function mudarFonte(delta) {
  const atual = NIVEIS_FONTE.indexOf(document.documentElement.dataset.fonte || 'normal')
  const proximo = Math.min(NIVEIS_FONTE.length - 1, Math.max(0, atual + delta))
  document.documentElement.dataset.fonte = NIVEIS_FONTE[proximo]
  localStorage.setItem('hestia.fontSize', NIVEIS_FONTE[proximo])
  registrarEvento('accessibility_font_change', getAbaAtiva(), { size: NIVEIS_FONTE[proximo] })
}

// ACESSIBILIDADE: alto contraste (RNF1)
function alternarContraste() {
  const raiz = document.documentElement
  raiz.dataset.tema = raiz.dataset.tema === 'alto-contraste' ? 'padrao' : 'alto-contraste'
  const ativo = raiz.dataset.tema === 'alto-contraste'
  localStorage.setItem('hestia.theme', ativo ? 'alto-contraste' : 'padrao')
  exibirMensagem(ativo ? t('accessibility.contrast.on') : t('accessibility.contrast.off'), 'info')
  registrarEvento('accessibility_contrast_change', getAbaAtiva(), { active: ativo })
}

function alternarTemaEscuro() {
  const raiz = document.documentElement
  const ativo = raiz.dataset.tema !== 'escuro'
  raiz.dataset.tema = ativo ? 'escuro' : 'padrao'
  if (ativo) document.documentElement.dataset.temaContrasteAnterior = 'ativo'
  else document.documentElement.removeAttribute('data-tema-contraste-anterior')
  localStorage.setItem('hestia.themeMode', ativo ? 'escuro' : 'padrao')
  exibirMensagem(ativo ? t('accessibility.theme.dark') : t('accessibility.theme.light'), 'info')
  registrarEvento('theme_change', getAbaAtiva(), { theme: ativo ? 'dark' : 'light' })
  const botao = document.getElementById('btnTema')
  botao.textContent = ativo ? '☀' : '☾'
  botao.setAttribute('aria-pressed', String(ativo))
}

function iniciarAcessibilidade() {
  document.getElementById('btnFonteMais').addEventListener('click', aumentarFonte)
  document.getElementById('btnFonteMenos').addEventListener('click', diminuirFonte)
  document.getElementById('btnContraste').addEventListener('click', alternarContraste)
  document.getElementById('btnTema').addEventListener('click', alternarTemaEscuro)
  document.getElementById('btnRevogarAnalytics')?.addEventListener('click', () => {
    revogarConsentimento()
    exibirMensagem(t('privacy.revoked'), 'info')
  })
}

function getAbaAtiva() {
  return document.querySelector('[data-aba][aria-selected="true"]')?.dataset.aba || 'analise'
}

function iniciarIdioma() {
  const seletor = document.getElementById('seletorIdioma')
  aplicarIdioma(idiomaAtual())
  seletor.querySelectorAll('[data-idioma]').forEach((botao) => {
    botao.addEventListener('click', () => {
      aplicarIdioma(botao.dataset.idioma)
      document.title = `${t('app.title')} — ${t('app.subtitle')}`
      registrarEvento('language_change', getAbaAtiva(), { language: botao.dataset.idioma })
    })
  })
  seletor.addEventListener('keydown', (evento) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(evento.key)) return
    evento.preventDefault()
    const botoes = [...seletor.querySelectorAll('[data-idioma]')]
    const atual = botoes.findIndex((botao) => botao.classList.contains('ativo'))
    const direcao = ['ArrowRight', 'ArrowDown'].includes(evento.key) ? 1 : -1
    const proximo = (atual + direcao + botoes.length) % botoes.length
    botoes[proximo].click()
    botoes[proximo].focus()
  })
  document.title = `${t('app.title')} — ${t('app.subtitle')}`
}

function restaurarPreferencias() {
  const fonte = localStorage.getItem('hestia.fontSize')
  if (['normal', 'grande', 'extra'].includes(fonte)) document.documentElement.dataset.fonte = fonte
  const tema = localStorage.getItem('hestia.theme')
  if (tema === 'alto-contraste') document.documentElement.dataset.tema = 'alto-contraste'
  const temaModo = localStorage.getItem('hestia.themeMode')
  if (temaModo === 'escuro' && !document.documentElement.dataset.tema) {
    document.documentElement.dataset.tema = 'escuro'
  }
  const botaoTema = document.getElementById('btnTema')
  if (botaoTema) {
    const escuro = document.documentElement.dataset.tema === 'escuro'
    botaoTema.textContent = escuro ? '☀' : '☾'
    botaoTema.setAttribute('aria-pressed', String(escuro))
  }
}

// Tenta registrar o Service Worker (PWA offline básico — opcional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => { /* opcional */ })
}

// BINDING INICIAL (módulo ES roda após o DOM ser parseado)
restaurarPreferencias()
iniciarIdioma()
iniciarNavegacao()
iniciarAcessibilidade()
iniciarAnalise(api)
iniciarAlertas()
iniciarGuia()
iniciarAnalytics()

// Expõe o toast para os módulos de seção (import circular resolvido por bindings vivos)
export { exibirMensagem, api }