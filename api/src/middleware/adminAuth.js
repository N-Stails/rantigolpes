const crypto = require('crypto')

function tokenSeguro(recebido, configurado) {
  if (!recebido || !configurado) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(configurado)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function adminAuth(req, res, next) {
  const configurado = process.env.HESTIA_ADMIN_TOKEN
  if (!configurado) {
    return res.status(503).json({ sucesso: false, mensagem: 'Painel administrativo não configurado.' })
  }
  const autenticacao = req.headers.authorization || ''
  const recebido = autenticacao.startsWith('Bearer ') ? autenticacao.slice(7).trim() : ''
  if (!tokenSeguro(recebido, configurado)) {
    res.set('WWW-Authenticate', 'Bearer')
    return res.status(401).json({ sucesso: false, mensagem: 'Acesso não autorizado.' })
  }
  next()
}

module.exports = adminAuth
