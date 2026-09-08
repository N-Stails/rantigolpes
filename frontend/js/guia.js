// Héstia — aba Guia: passo a passo pós-golpe (RF3)
import { falar } from './voz.js'

let listaEtapas, progressoEl

export async function iniciarGuia() {
  listaEtapas = document.getElementById('etapasGuia')
  progressoEl = document.createElement('p')
  progressoEl.className = 'card text-center text-lg font-semibold text-gray-700'
  listaEtapas.parentNode.insertBefore(progressoEl, listaEtapas)

  try {
    const resposta = await fetch('/api/guia')
    const dados = await resposta.json()
    const passos = dados.sucesso ? dados.dados : []

    if (passos.length === 0) return
    passos.forEach((passo, indice) => listaEtapas.appendChild(renderizarPasso(passo, indice + 1)))
    atualizarProgresso()
  } catch {
    progressoEl.textContent = 'Não foi possível carregar o guia. Tente novamente em instantes.'
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
  btnVoz.textContent = '🔊 Ouvir'
  btnVoz.setAttribute('aria-label', `Ouvir o passo: ${passo.titulo}`)
  btnVoz.addEventListener('click', () => falar(`Passo ${numero}. ${passo.titulo}. ${passo.descricao}`))

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
  check.addEventListener('change', atualizarProgresso)

  const textoCheck = document.createElement('span')
  textoCheck.className = 'text-gray-700 font-medium'
  textoCheck.textContent = 'Passo feito ✅'

  rotulo.appendChild(check)
  rotulo.appendChild(textoCheck)

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
    ? 'Carregando passos...'
    : feitos === total
      ? `🎉 Você completou todos os ${total} passos! Busque o banco (MED) e a polícia o quanto antes.`
      : `Progresso: ${feitos} de ${total} passos concluídos.`
}