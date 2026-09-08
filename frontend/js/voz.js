// Héstia — módulo de acessibilidade por voz (RNF1)
// Entrada: Web Speech API (SpeechRecognition) • Saída: speechSynthesis

const temEntradaVoz = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
const temSaidaVoz = 'speechSynthesis' in window

export function suportaEntradaVoz() {
  return temEntradaVoz
}

export function suportaSaidaVoz() {
  return temSaidaVoz
}

// Lê um texto em voz alta (pt-BR)
export function falar(texto) {
  if (!temSaidaVoz || !texto) return false
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'pt-BR'
  u.rate = 0.95
  u.pitch = 1
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
  return true
}

export function pararFala() {
  if (temSaidaVoz) speechSynthesis.cancel()
}

let reconhecedor = null
let transcrever = null
let aoTerminarEscuta = null

// Inicia a escuta por microfone; transcreve enquanto fala
export function iniciarEscuta(aoTranscrever, aoEstado) {
  if (!temEntradaVoz) return false

  const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition
  reconhecedor = new Reconhecimento()
  reconhecedor.lang = 'pt-BR'
  reconhecedor.continuous = false
  reconhecedor.interimResults = true

  transcrever = aoTranscrever
  aoTerminarEscuta = aoEstado

  reconhecedor.onresult = (evento) => {
    let texto = ''
    for (let i = evento.resultIndex; i < evento.results.length; i++) {
      texto += evento.results[i][0].transcript
    }
    if (transcrever) transcrever(texto)
  }
  reconhecedor.onstart = () => aoEstado && aoEstado(true)
  reconhecedor.onend = () => { if (aoEstado) aoEstado(false) }
  reconhecedor.onerror = () => { if (aoEstado) aoEstado(false) }

  reconhecedor.start()
  return true
}

export function pararEscuta() {
  if (reconhecedor) {
    try { reconhecedor.stop() } catch { /* ignora */ }
    reconhecedor = null
    if (aoTerminarEscuta) { aoTerminarEscuta(false); aoTerminarEscuta = null }
  }
}