// Héstia — aba Alertas: Central de Alertas da semana por região (RF4)
import { falar } from './voz.js'
import { t, formatarData, formatarNumero, idiomaAtual } from './i18n.js'
import { registrarEvento } from './analytics.js'

const NIVEL_ALERTA = {
  verde:    { rotulo: 'risk.low',  classe: 'bg-green-100 text-green-800 border-green-300' },
  amarelo:  { rotulo: 'risk.medium',  classe: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  vermelho: { rotulo: 'risk.high',   classe: 'bg-red-100 text-red-800 border-red-300' }
}

let filtroRegiao, filtroCategoria, buscaEl, ordenarEl, listaAh, estadoEl
let temporizadorBusca

export function iniciarAlertas(api) {
  filtroRegiao = document.getElementById('filtroRegiao')
  filtroCategoria = document.getElementById('filtroCategoria')
  buscaEl = document.getElementById('buscaAlertas')
  ordenarEl = document.getElementById('ordenarAlertas')
  listaAh = document.getElementById('listaAlertas')
  estadoEl = document.getElementById('estadoAlertas')

  filtroRegiao.addEventListener('change', carregar)
  filtroCategoria.addEventListener('change', carregar)
  ordenarEl?.addEventListener('change', carregar)
  buscaEl.addEventListener('input', () => {
    clearTimeout(temporizadorBusca)
    temporizadorBusca = setTimeout(carregar, 250)
  })
  document.addEventListener('hestia:idioma', carregar)

  carregar()
}

async function carregar() {
  estadoEl.textContent = t('alerts.loading')
  estadoEl.classList.remove('hidden')
  listaAh.innerHTML = ''

  const params = new URLSearchParams()
  if (filtroRegiao.value) params.set('regiao', filtroRegiao.value)
  if (filtroCategoria.value) params.set('categoria', filtroCategoria.value)
  if (buscaEl.value.trim()) params.set('q', buscaEl.value.trim())
  if (ordenarEl?.value) params.set('ordenar', ordenarEl.value)

  try {
    const resposta = await fetch(`/api/alertas?${params.toString()}`, {
      headers: { 'Accept-Language': idiomaAtual() }
    })
    const dados = await resposta.json()
    const alertas = dados.sucesso ? dados.dados : []

    preencherFiltros(alertas)

    if (alertas.length === 0) {
      estadoEl.textContent = t('alerts.empty')
      return
    }

    estadoEl.classList.add('hidden')
    alertas.forEach((alerta) => listaAh.appendChild(renderizarAlerta(alerta)))
  } catch {
    estadoEl.textContent = t('alerts.error')
  }
}

// Preenche os filtros dinamicamente com os dados existentes
function preencherFiltros(alertas) {
  const regioes = [...new Set(alertas.map((a) => a.regiao))].sort()
  const categorias = [...new Set(alertas.map((a) => a.categoria))].sort()

  const regiaoAtual = filtroRegiao.value
  filtroRegiao.innerHTML = `<option value="">${t('alerts.allRegions')}</option>`
  regioes.forEach((r) => {
    const opt = document.createElement('option')
    opt.value = r
    opt.textContent = r
    filtroRegiao.appendChild(opt)
  })
  filtroRegiao.value = regioes.includes(regiaoAtual) ? regiaoAtual : ''

  const categoriaAtual = filtroCategoria.value
  filtroCategoria.innerHTML = `<option value="">${t('alerts.allCategories')}</option>`
  categorias.forEach((c) => {
    const opt = document.createElement('option')
    opt.value = c
    opt.textContent = c
    filtroCategoria.appendChild(opt)
  })
  filtroCategoria.value = categorias.includes(categoriaAtual) ? categoriaAtual : ''
}

function renderizarAlerta(alerta) {
  const nivel = NIVEL_ALERTA[alerta.nivel_risco] || NIVEL_ALERTA.amarelo
  const data = formatarData(alerta.data_publicacao)

  const article = document.createElement('article')
  article.className = 'card'
  article.setAttribute('data-risco', alerta.nivel_risco)

  const cabecalho = document.createElement('div')
  cabecalho.className = 'flex items-start justify-between gap-3 flex-wrap'

  const h3 = document.createElement('h3')
  h3.className = 'text-lg font-bold text-slate-900'
  h3.textContent = alerta.titulo

  const selo = document.createElement('span')
  selo.className = `shrink-0 text-sm font-bold px-3 py-1 rounded-full border-2 ${nivel.classe}`
  selo.textContent = `${t('alerts.risk')} ${t(nivel.rotulo)}`
  selo.setAttribute('aria-hidden', 'true')

  cabecalho.appendChild(h3)
  cabecalho.appendChild(selo)

  const p = document.createElement('p')
  p.className = 'mt-2 text-gray-600'
  p.textContent = alerta.descricao

  const rodape = document.createElement('div')
  rodape.className = 'mt-3 flex items-center justify-between gap-2 flex-wrap text-sm text-gray-500'
  rodape.innerHTML = `<span>📍 ${alerta.regiao} • ${alerta.categoria}</span><span>📅 ${data}</span>`

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'mt-3 btn-secundario'
  btn.innerHTML = `<span aria-hidden="true">🔊</span> ${t('alerts.listen')}`
  btn.setAttribute('aria-label', t('alerts.listenAria'))
  btn.addEventListener('click', () => {
    registrarEvento('alert_listened', 'alertas', { alert_id: alerta.id })
    falar(`${alerta.titulo}. ${t('alerts.risk')} ${t(nivel.rotulo)}. ${alerta.descricao}`)
  })

  article.appendChild(cabecalho)
  article.appendChild(p)
  article.appendChild(rodape)
  article.appendChild(btn)

  if (alerta.fonte || alerta.fonte_url) {
    const fonte = document.createElement('p')
    fonte.className = 'mt-3 text-sm text-gray-500'
    if (alerta.fonte_url) {
      const link = document.createElement('a')
      link.href = alerta.fonte_url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.className = 'underline'
      link.textContent = `${t('alerts.source')}: ${alerta.fonte || alerta.fonte_url}`
      fonte.appendChild(link)
    } else {
      fonte.textContent = `${t('alerts.source')}: ${alerta.fonte}`
    }
    article.appendChild(fonte)
  }

  const rastreabilidade = document.createElement('p')
  rastreabilidade.className = 'mt-2 text-xs text-gray-500'
  const partes = []
  if (alerta.data_publicacao) partes.push(`${t('alerts.published')}: ${formatarData(alerta.data_publicacao)}`)
  if (alerta.verificado_em) partes.push(`${t('alerts.verified')}: ${formatarData(alerta.verificado_em)}`)
  if (alerta.situacao) partes.push(`${t('alerts.status')}: ${alerta.situacao.replaceAll('_', ' ')}`)
  if (partes.length) {
    rastreabilidade.textContent = partes.join(' • ')
    article.appendChild(rastreabilidade)
  }

  if (navigator.share) {
    const compartilhar = document.createElement('button')
    compartilhar.type = 'button'
    compartilhar.className = 'mt-3 ml-2 btn-secundario'
    compartilhar.textContent = `↗ ${t('alerts.share')}`
    compartilhar.addEventListener('click', () => navigator.share({
      title: alerta.titulo,
      text: alerta.descricao,
      url: location.href
    }).catch(() => {}))
    article.appendChild(compartilhar)
  }
  return article
}
