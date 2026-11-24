// Héstia — aba Análise: triagem de link/texto/Pix e Semáforo de Risco (RF1/RF2)
import { falar, iniciarEscuta, pararEscuta } from './voz.js'
import { exibirMensagem } from './app.js'
import { t, formatarNumero, formatarData } from './i18n.js'
import { registrarEvento } from './analytics.js'

const CORES = {
  verde:    { titulo: 'risk.safe',                 simbolo: '✔' },
  amarelo:  { titulo: 'risk.caution',              simbolo: '⚠️' },
  vermelho: { titulo: 'risk.danger',               simbolo: '🚫' },
  cinza:    { titulo: 'risk.inconclusive',         simbolo: '?' }
}

let formulario, tipoEl, conteudoEl, btnAnalisar, textoBtn, btnVoz, contadorEl, resultadoEl
let semaforoEl, semaforoSimbuloEl, resultadoTitulo, resultadoResumo, resultadoMotivos, resultadoTempo
let resultadoRecomendacao, resultadoRecomendacaoTexto, resultadoNeutros, resultadoNeutrosLista
let resultadoConfianca, resultadoMetodo
let tipoEscolhidoManualmente = false

export function iniciarAnalise(api) {
  formulario = document.getElementById('formAnalise')
  tipoEl = document.getElementById('tipo')
  conteudoEl = document.getElementById('conteudo')
  btnAnalisar = document.getElementById('btnAnalisar')
  textoBtn = document.getElementById('textoBtnAnalisar')
  btnVoz = document.getElementById('btnVozEntrada')
  contadorEl = document.getElementById('contadorConteudo')
  resultadoEl = document.getElementById('resultado')
  semaforoEl = document.getElementById('semaforo')
  semaforoSimbuloEl = document.getElementById('semaforoSimbulo')
  resultadoTitulo = document.getElementById('resultadoTitulo')
  resultadoResumo = document.getElementById('resultadoResumo')
  resultadoMotivos = document.getElementById('resultadoMotivos')
  resultadoTempo = document.getElementById('resultadoTempo')
  resultadoRecomendacao = document.getElementById('resultadoRecomendacao')
  resultadoRecomendacaoTexto = document.getElementById('resultadoRecomendacaoTexto')
  resultadoNeutros = document.getElementById('resultadoNeutros')
  resultadoNeutrosLista = document.getElementById('resultadoNeutrosLista')
  resultadoConfianca = document.getElementById('resultadoConfianca')
  resultadoMetodo = document.getElementById('resultadoMetodo')

  tipoEl.addEventListener('change', () => { tipoEscolhidoManualmente = true })

  conteudoEl.addEventListener('input', () => {
    contadorEl.textContent = `${formatarNumero(conteudoEl.value.length)} / ${formatarNumero(2000)}`
    if (!tipoEscolhidoManualmente) detectarTipoAutomatico(conteudoEl.value)
  })

  btnVoz.addEventListener('click', async () => {
    if (btnVoz.classList.contains('ativo')) {
      pararEscuta()
      btnVoz.classList.remove('ativo')
      btnVoz.innerHTML = `<span aria-hidden="true">🎤</span> <span data-i18n="analysis.voice.start">${t('analysis.voice.start')}</span>`
      return
    }
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      } catch (erro) {
        exibirMensagem(erro?.name === 'NotAllowedError'
          ? t('analysis.voice.permissionDenied')
          : t('analysis.voice.permissionError'), 'erro')
        return
      }
    }
    const ok = iniciarEscuta((texto) => {
      conteudoEl.value = texto
      contadorEl.textContent = `${formatarNumero(texto.length)} / ${formatarNumero(2000)}`
      if (!tipoEscolhidoManualmente) detectarTipoAutomatico(texto)
    }, (ativo, erro) => {
      btnVoz.classList.toggle('ativo', ativo)
      btnVoz.innerHTML = ativo
        ? `<span aria-hidden="true">⏹</span> <span data-i18n="analysis.voice.stop">${t('analysis.voice.stop')}</span>`
        : `<span aria-hidden="true">🎤</span> <span data-i18n="analysis.voice.start">${t('analysis.voice.start')}</span>`
      if (!ativo && erro && erro !== 'aborted') {
        exibirMensagem(t('analysis.voice.processingError'), 'erro')
      }
    })
    if (!ok) exibirMensagem(t('analysis.voice.unsupported'), 'info')
  })

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    if (btnAnalisar.disabled) return

    const conteudo = conteudoEl.value.trim()
    if (conteudo.length < 3) {
      exibirMensagem(t('analysis.validation'), 'erro')
      conteudoEl.focus()
      return
    }

    alternarCarregando(true)
    formulario.setAttribute('aria-busy', 'true')
    try {
      const resultado = await api('/analises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoEl.value, conteudo })
      })

      if (!resultado.sucesso) {
        const msg = (resultado.erros || []).join(' ')
        exibirMensagem(msg || resultado.mensagem, 'erro')
        return
      }

      exibirResultado(resultado)
      registrarEvento('analysis_completed', 'analise', { risk: resultado.risco, type: tipoEl.value })
    } catch {
      exibirMensagem(t('analysis.connection'), 'erro')
    } finally {
      alternarCarregando(false)
      formulario.removeAttribute('aria-busy')
    }
  })
}

function detectarTipoAutomatico(conteudo) {
  const valor = conteudo.trim()
  if (!valor) return
  if (/^(https?:\/\/|www\.)/i.test(valor) || /^[^\s]+\.[a-z]{2,}(\/\S*)?$/i.test(valor)) {
    tipoEl.value = 'link'
  } else if (valor.includes('@') || /^\(?\d{10,11}\)?$/.test(valor.replace(/[^\d]/g, '')) || /^[a-f0-9]{8}-/i.test(valor)) {
    tipoEl.value = 'pix'
  } else {
    tipoEl.value = 'texto'
  }
}

function alternarCarregando(ativo) {
  btnAnalisar.disabled = ativo
  btnAnalisar.setAttribute('aria-busy', String(ativo))
  textoBtn.textContent = ativo ? t('analysis.loading') : t('analysis.submit')
}

// Renderiza o Semáforo de Risco e lê o resultado em voz alta
function exibirResultado(resultado) {
  const nivel = CORES[resultado.risco] || CORES.amarelo

  semaforoEl.dataset.risco = resultado.risco
  semaforoSimbuloEl.textContent = nivel.simbolo
  resultadoTitulo.textContent = t(nivel.titulo)
  resultadoResumo.textContent = resultado.resumo

  resultadoMotivos.innerHTML = ''
  for (const detalhe of resultado.regras_detalhes || []) {
    const li = document.createElement('li')
    li.textContent = detalhe.descricao
    resultadoMotivos.appendChild(li)
  }

  resultadoNeutrosLista.innerHTML = ''
  for (const item of resultado.itens_nao_suspeitos || []) {
    const li = document.createElement('li')
    li.textContent = item.descricao
    resultadoNeutrosLista.appendChild(li)
  }
  resultadoNeutros.hidden = !resultado.itens_nao_suspeitos?.length

  const nivelConfianca = resultado.confianca?.nivel
  const chaveConfianca = nivelConfianca === 'moderada' || nivelConfianca === 'moderate'
    ? 'analysis.confidence.moderate'
    : 'analysis.confidence.low'
  resultadoConfianca.textContent = `${t('analysis.confidence')}: ${t(chaveConfianca)}. ${resultado.confianca?.justificativa || ''}`

  const data = resultado.data_hora_analise
    ? new Intl.DateTimeFormat(document.documentElement.lang || 'pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(resultado.data_hora_analise))
    : ''
  const metodo = resultado.modo_analise === 'ia_local_ollama'
    ? t('analysis.method.aiLocal')
    : t('analysis.method.local')
  resultadoMetodo.textContent = `${t('analysis.method')}: ${metodo} · ${t('analysis.sources.none')}${data ? ` · ${t('analysis.date')}: ${data}` : ''}`

  resultadoTempo.textContent = resultado.tempo_ms != null
    ? `${t('analysis.completed')} ${formatarNumero(resultado.tempo_ms)} ms`
    : ''

  const chaveRecomendacao = resultado.classificacao === 'risco_identificado' || resultado.risco === 'vermelho'
    ? 'analysis.recommendation.danger'
    : resultado.classificacao === 'atencao_necessaria' || resultado.risco === 'amarelo'
      ? 'analysis.recommendation.caution'
      : 'analysis.recommendation.inconclusive'
  resultadoRecomendacaoTexto.textContent = t(chaveRecomendacao)
  resultadoRecomendacao.hidden = false

  resultadoEl.classList.remove('hidden')
  resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

  falar(`${t(nivel.titulo)}. ${resultado.resumo}`)
}