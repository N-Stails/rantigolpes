// Héstia — aba Alertas: Central de Alertas da semana por região (RF4)
import { falar } from './voz.js'

const NIVEL_ALERTA = {
  verde:    { rotulo: 'Baixo',  classe: 'bg-green-100 text-green-800 border-green-300' },
  amarelo:  { rotulo: 'Médio',  classe: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  vermelho: { rotulo: 'Alto',   classe: 'bg-red-100 text-red-800 border-red-300' }
}

let filtroRegiao, filtroCategoria, listaAh, estadoEl

export function iniciarAlertas(api) {
  filtroRegiao = document.getElementById('filtroRegiao')
  filtroCategoria = document.getElementById('filtroCategoria')
  listaAh = document.getElementById('listaAlertas')
  estadoEl = document.getElementById('estadoAlertas')

  filtroRegiao.addEventListener('change', carregar)
  filtroCategoria.addEventListener('change', carregar)

  carregar()
}

async function carregar() {
  estadoEl.textContent = 'Carregando alertas...'
  estadoEl.classList.remove('hidden')
  listaAh.innerHTML = ''

  const params = new URLSearchParams()
  if (filtroRegiao.value) params.set('regiao', filtroRegiao.value)
  if (filtroCategoria.value) params.set('categoria', filtroCategoria.value)

  try {
    const resposta = await fetch(`/api/alertas?${params.toString()}`)
    const dados = await resposta.json()
    const alertas = dados.sucesso ? dados.dados : []

    preencherFiltros(alertas)

    if (alertas.length === 0) {
      estadoEl.textContent = 'Nenhum alerta encontrado para esse filtro. Que ótimo sinal!'
      return
    }

    estadoEl.classList.add('hidden')
    alertas.forEach((alerta) => listaAh.appendChild(renderizarAlerta(alerta)))
  } catch {
    estadoEl.textContent = 'Não foi possível carregar os alertas. Tente novamente em instantes.'
  }
}

// Preenche os filtros dinamicamente com os dados existentes
function preencherFiltros(alertas) {
  const regioes = [...new Set(alertas.map((a) => a.regiao))].sort()
  const categorias = [...new Set(alertas.map((a) => a.categoria))].sort()

  const regiaoAtual = filtroRegiao.value
  filtroRegiao.innerHTML = '<option value="">Todas as regiões</option>'
  regioes.forEach((r) => {
    const opt = document.createElement('option')
    opt.value = r
    opt.textContent = r
    filtroRegiao.appendChild(opt)
  })
  filtroRegiao.value = regioes.includes(regiaoAtual) ? regiaoAtual : ''

  const categoriaAtual = filtroCategoria.value
  filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>'
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
  selo.textContent = `Risco ${nivel.rotulo}`
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
  btn.textContent = '🔊 Ouvir alerta'
  btn.addEventListener('click', () => falar(`${alerta.titulo}. Nível de risco ${nivel.rotulo}. ${alerta.descricao}`))

  article.appendChild(cabecalho)
  article.appendChild(p)
  article.appendChild(rodape)
  article.appendChild(btn)
  return article
}

function formatarData(dataBanco) {
  if (!dataBanco) return '—'
  const m = dataBanco.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return dataBanco
  return `${m[3]}/${m[2]}/${m[1]}`
}