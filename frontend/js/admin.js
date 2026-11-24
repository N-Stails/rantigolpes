import { aplicarIdioma, idiomaAtual, t, formatarNumero } from './i18n.js'

aplicarIdioma(idiomaAtual())
document.title = `${t('admin.title')} — ${t('app.title')}`

function renderLista(titulo, valores, chave = 'pagina') {
  const article = document.createElement('article')
  article.className = 'card'
  const h2 = document.createElement('h2')
  h2.className = 'text-lg font-bold'
  h2.textContent = titulo
  const ul = document.createElement('ul')
  ul.className = 'mt-2 space-y-1'
  for (const item of valores || []) {
    const li = document.createElement('li')
    li.textContent = `${item[chave] || '—'} — ${formatarNumero(item.total)}`
    ul.appendChild(li)
  }
  article.append(h2, ul)
  return article
}

document.getElementById('formAdmin').addEventListener('submit', async (evento) => {
  evento.preventDefault()
  const token = document.getElementById('tokenAdmin').value
  const periodo = document.getElementById('periodoMetricas')?.value || '30'
  const erro = document.getElementById('erroAdmin')
  const container = document.getElementById('metricasAdmin')
  erro.textContent = ''
  try {
    const resposta = await fetch(`/api/analytics/metrics?periodo=${encodeURIComponent(periodo)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const dados = await resposta.json()
    if (!resposta.ok || !dados.sucesso) throw new Error()

    document.getElementById('metricasVisitantes').textContent = formatarNumero(dados.dados.visitantes)
    document.getElementById('metricasRecorrentes').textContent = formatarNumero(dados.dados.recorrentes)
    document.getElementById('metricasEventos').textContent = formatarNumero(dados.dados.eventos)
    document.getElementById('metricasAnalises').textContent = formatarNumero(dados.dados.analises)

    const listas = document.getElementById('listasMetricas')
    listas.innerHTML = ''
    listas.append(
      renderLista(t('admin.pages'), dados.dados.paginas, 'pagina'),
      renderLista(t('admin.devices'), dados.dados.dispositivos, 'dispositivo'),
      renderLista(t('admin.browsers'), dados.dados.navegadores, 'navegador'),
      renderLista(t('admin.systems'), dados.dados.sistemas, 'sistema'),
      renderLista(t('admin.languages'), dados.dados.idiomas, 'idioma')
    )
    container.hidden = false
  } catch {
    container.hidden = true
    erro.textContent = t('admin.error')
  }
})
