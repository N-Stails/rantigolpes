// Héstia — Alerta Cidadão. Ponto de entrada do frontend.
import { iniciarAnalise } from './analise.js'
import { iniciarAlertas } from './alertas.js'
import { iniciarGuia } from './guia.js'
import { pararFala } from './voz.js'

// Chamada genérica à API (mesmo domínio, servida pelo Express)
async function api(rota, opcoes = {}) {
  const resposta = await fetch(`/api${rota}`, opcoes)
  return resposta.json()
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
}

// ACESSIBILIDADE: alto contraste (RNF1)
function alternarContraste() {
  const raiz = document.documentElement
  raiz.dataset.tema = raiz.dataset.tema === 'alto-contraste' ? 'padrao' : 'alto-contraste'
  const ativo = raiz.dataset.tema === 'alto-contraste'
  exibirMensagem(ativo ? 'Alto contraste ativado. Texto com maior destaque e fundo escuro.' : 'Tema padrão restaurado.', 'info')
}

function iniciarAcessibilidade() {
  document.getElementById('btnFonteMais').addEventListener('click', aumentarFonte)
  document.getElementById('btnFonteMenos').addEventListener('click', diminuirFonte)
  document.getElementById('btnContraste').addEventListener('click', alternarContraste)
}

// Tenta registrar o Service Worker (PWA offline básico — opcional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => { /* opcional */ })
}

// BINDING INICIAL (módulo ES roda após o DOM ser parseado)
iniciarNavegacao()
iniciarAcessibilidade()
iniciarAnalise(api)
iniciarAlertas()
iniciarGuia()

// Expõe o toast para os módulos de seção (import circular resolvido por bindings vivos)
export { exibirMensagem, api }