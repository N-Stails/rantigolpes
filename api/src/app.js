const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const rotasAnalise = require('./rotas/analiseRotas')
const rotasAlertas = require('./rotas/alertaRotas')
const rotasGuia = require('./rotas/guiaRotas')
const rotasAnalytics = require('./rotas/analyticsRotas')
const securityLogger = require('./middleware/securityLogger')
const rateLimit = require('./middleware/rateLimit')

const app = express()

// Middlewares de segurança e parsing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginResourcePolicy: { policy: 'same-origin' }
}))

const origensPermitidas = (process.env.ORIGEM_PERMITIDA || '*')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean)
app.use(cors({
  origin: origensPermitidas.includes('*') ? '*' : origensPermitidas,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Hestia-Language']
}))
app.use(express.json({ limit: '10kb' }))
app.use('/api', rateLimit({ limite: 120 }))
app.use(securityLogger)

// Servir arquivos estáticos do frontend
const caminhoFrontend = path.resolve(__dirname, '../../frontend')
app.use(express.static(caminhoFrontend))

// Rotas da API
app.use('/api', rotasAnalise)
app.use('/api', rotasAlertas)
app.use('/api', rotasGuia)
app.use('/api', rotasAnalytics)

// Rota de health check
app.get('/api/health', (_, res) => res.json({ sucesso: true, mensagem: 'API Héstia funcionando!' }))

// Fallback para o app (index.html)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(caminhoFrontend, 'index.html'))
})

module.exports = app