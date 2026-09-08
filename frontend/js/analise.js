// Héstia — aba Análise: triagem de link/texto/Pix e Semáforo de Risco (RF1/RF2)
import { falar, iniciarEscuta, pararEscuta } from './voz.js'
import { exibirMensagem } from './app.js'

const CORES = {
  verde:    { titulo: 'Parece seguro',                 simbolo: '✔',  resumoCor: 'Confira os detalhes abaixo' },
  amarelo:  { titulo: 'Tenha cuidado',                 simbolo: '⚠️', resumoCor: 'Possíveis sinais de golpe' },
  vermelho: { titulo: 'Provável golpe!',               simbolo: '🚫', resumoCor: 'alto risco — não prossiga' }
}

let formulario, tipoEl, conteudoEl, btnAnalisar, textoBtn, btnVoz, contadorEl, resultadoEl
let semaforoEl, semaforoSimbuloEl, resultadoTitulo, resultadoResumo, resultadoMotivos, resultadoTempo

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

  conteudoEl.addEventListener('input', () => {
    contadorEl.textContent = `${conteudoEl.value.length} / 2000`
  })

  btnVoz.addEventListener('click', () => {
    if (btnVoz.classList.contains('ativo')) {
      pararEscuta()
      btnVoz.classList.remove('ativo')
      btnVoz.textContent = '🎤 Falar em vez de digitar'
      return
    }
    const ok = iniciarEscuta((texto) => {
      conteudoEl.value = texto
      contadorEl.textContent = `${texto.length} / 2000`
    }, (ativo) => {
      btnVoz.classList.toggle('ativo', ativo)
      btnVoz.textContent = ativo ? '⏹ Parar de falar' : '🎤 Falar em vez de digitar'
    })
    if (!ok) exibirMensagem('Seu navegador não suporta comando de voz. Você pode digitar normalmente.', 'info')
  })

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    if (btnAnalisar.disabled) return

    const conteudo = conteudoEl.value.trim()
    if (conteudo.length < 3) {
      exibirMensagem('Digite (ou fale) o link, mensagem ou chave Pix que deseja analisar (mínimo 3 caracteres).', 'erro')
      conteudoEl.focus()
      return
    }

    alternarCarregando(true)
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
    } catch {
      exibirMensagem('Erro de conexão com o servidor. Tente novamente.', 'erro')
    } finally {
      alternarCarregando(false)
    }
  })
}

function alternarCarregando(ativo) {
  btnAnalisar.disabled = ativo
  textoBtn.textContent = ativo ? 'Analisando...' : 'Analisar agora'
}

// Renderiza o Semáforo de Risco e lê o resultado em voz alta
function exibirResultado(resultado) {
  const nivel = CORES[resultado.risco] || CORES.amarelo

  semaforoEl.dataset.risco = resultado.risco
  semaforoSimbuloEl.textContent = nivel.simbolo
  resultadoTitulo.textContent = nivel.titulo
  resultadoResumo.textContent = resultado.resumo

  resultadoMotivos.innerHTML = ''
  for (const detalhe of resultado.regras_detalhes || []) {
    const li = document.createElement('li')
    li.textContent = '• ' + detalhe.descricao
    resultadoMotivos.appendChild(li)
  }

  resultadoTempo.textContent = resultado.tempo_ms != null
    ? `Análise concluída em ${resultado.tempo_ms} ms`
    : ''

  resultadoEl.classList.remove('hidden')
  resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

  falar(`${nivel.titulo}. ${resultado.resumo}`)
}