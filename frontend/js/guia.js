// Héstia — aba Guia: passo a passo pós-golpe (RF3)
import { falar } from './voz.js'
import { t, formatarNumero } from './i18n.js'
import { registrarEvento } from './analytics.js'
import { idiomaAtual } from './i18n.js'

let listaEtapas, progressoEl
let ouvindoMudancaIdioma = false
const CHAVE_CONCLUIDOS = 'hestia.guide.completed'

function carregarConcluidos() {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE_CONCLUIDOS) || '[]')
    return Array.isArray(valor) ? new Set(valor) : new Set()
  } catch {
    return new Set()
  }
}

function salvarConcluidos() {
  const checks = [...listaEtapas.querySelectorAll('input[type="checkbox"][data-passo]')]
  const concluidos = checks.filter((check) => check.checked).map((check) => check.dataset.passo)
  localStorage.setItem(CHAVE_CONCLUIDOS, JSON.stringify(concluidos))
}

export async function iniciarGuia() {
  listaEtapas = document.getElementById('etapasGuia')
  if (!progressoEl) {
    progressoEl = document.createElement('p')
    progressoEl.className = 'card text-center text-lg font-semibold text-gray-700'
    listaEtapas.parentNode.insertBefore(progressoEl, listaEtapas)
  }
  if (!ouvindoMudancaIdioma) {
    ouvindoMudancaIdioma = true
    document.addEventListener('hestia:idioma', () => {
      listaEtapas.innerHTML = ''
      iniciarGuia()
    })
  }

  try {
    const resposta = await fetch('/api/guia', {
      headers: { 'Accept-Language': idiomaAtual() }
    })
    const dados = await resposta.json()
    const passos = dados.sucesso ? dados.dados : []

    if (passos.length === 0) return
    passos.forEach((passo, indice) => listaEtapas.appendChild(renderizarPasso(passo, indice + 1)))
    atualizarProgresso()
  } catch {
    progressoEl.textContent = t('guide.error')
  }
}

function renderizarPasso(passo, numero) {
  const article = document.createElement('article')
  article.className = 'card flex gap-4 items-start'

  const numeroEl = document.createElement('span')
  numeroEl.className =
    'shrink-0 w-11 h-11 rounded-full bg-emerald-700 text-white font-extrabold text-xl flex items-center justify-center'
  numeroEl.textContent = numero
  numeroEl.setAttribute('aria-hidden', 'true')

  const corpo = document.createElement('div')
  corpo.className = 'flex-1'

  const cabecalho = document.createElement('div')
  cabecalho.className = 'flex items-center justify-between gap-2 flex-wrap'

  const h3 = document.createElement('h3')
  h3.className = 'text-lg font-bold text-slate-900'
  h3.textContent = passo.titulo

  const btnVoz = document.createElement('button')
  btnVoz.type = 'button'
  btnVoz.className = 'btn-secundario'
  btnVoz.innerHTML = `<span aria-hidden="true">🔊</span> ${t('guide.listen')}`
  btnVoz.setAttribute('aria-label', `${t('guide.listenStep')} ${passo.titulo}`)
  btnVoz.addEventListener('click', () => {
    registrarEvento('guide_step_listened', 'guia', { step: numero })
    falar(`${t('guide.step')} ${formatarNumero(numero)}. ${passo.titulo}. ${passo.descricao}`)
  })

  cabecalho.appendChild(h3)
  cabecalho.appendChild(btnVoz)

  const p = document.createElement('p')
  p.className = 'mt-2 text-gray-600'
  p.textContent = passo.descricao

  const rotulo = document.createElement('label')
  rotulo.className = 'mt-3 inline-flex items-center gap-2 cursor-pointer select-none'

  const check = document.createElement('input')
  check.type = 'checkbox'
  check.className = 'w-6 h-6 accent-emerald-700'
  check.dataset.passo = String(numero)
  check.checked = carregarConcluidos().has(String(numero))
  check.addEventListener('change', () => {
    salvarConcluidos()
    atualizarTextoChecklist(check)
    atualizarProgresso()
  })

  const textoCheck = document.createElement('span')
  textoCheck.className = 'text-gray-700 font-medium'
  textoCheck.textContent = t(check.checked ? 'guide.done' : 'guide.todo')
  textoCheck.dataset.checklistLabel = String(numero)

  rotulo.appendChild(check)
  rotulo.appendChild(textoCheck)
  atualizarTextoChecklist(check)

  corpo.appendChild(cabecalho)
  corpo.appendChild(p)
  corpo.appendChild(rotulo)

  article.appendChild(numeroEl)
  article.appendChild(corpo)
  return article
}

function atualizarProgresso() {
  const checks = listaEtapas.querySelectorAll('input[type="checkbox"]')
  const feitos = [...checks].filter((c) => c.checked).length
  const total = checks.length
  progressoEl.textContent = total === 0
    ? t('guide.loading')
    : feitos === total
      ? `🎉 ${t('guide.completed')}`
      : `${t('guide.progress')} ${formatarNumero(feitos)} ${t('guide.of')} ${formatarNumero(total)}`
}

function atualizarTextoChecklist(check) {
  const rotulo = check.parentElement.querySelector('[data-checklist-label]')
  if (!rotulo) return
  rotulo.textContent = check.checked ? `✓ ${t('guide.done')}` : t('guide.todo')
  rotulo.classList.toggle('text-emerald-700', check.checked)
  check.setAttribute('aria-label', check.checked ? t('guide.done') : t('guide.todo'))
}