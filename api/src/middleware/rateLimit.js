const janelas = new Map()

function rateLimit({ janelaMs = 15 * 60 * 1000, limite = 100 } = {}) {
  return function limitar(req, res, next) {
    const agora = Date.now()
    const chave = req.ip || 'desconhecido'
    let registro = janelas.get(chave)
    if (!registro || agora - registro.inicio >= janelaMs) {
      registro = { inicio: agora, quantidade: 0 }
      janelas.set(chave, registro)
    }
    registro.quantidade += 1
    if (registro.quantidade > limite) {
      res.set('Retry-After', String(Math.ceil((janelaMs - (agora - registro.inicio)) / 1000)))
      return res.status(429).json({
        sucesso: false,
        mensagem: 'Muitas requisições. Tente novamente mais tarde.'
      })
    }
    next()
  }
}
module.exports = rateLimit