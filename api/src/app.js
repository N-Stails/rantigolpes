const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const rotasAnalise = require('./rotas/analiseRotas')
const rotasAlertas = require('./rotas/alertaRotas')
const rotasGuia = require('./rotas/guiaRotas')

const app = express()

// Middlewares de segurança e parsing
app.use(helmet({
  contentSecurityPolicy: false
}))
app.use(cors({ origin: process.env.ORIGEM_PERMITIDA || '*' }))
app.use(express.json({ limit: '10kb' }))

// Servir arquivos estáticos do frontend
const caminhoFrontend = path.resolve(__dirname, '../../frontend')
app.use(express.static(caminhoFrontend))

// Rotas da API
app.use('/api', rotasAnalise)
app.use('/api', rotasAlertas)
app.use('/api', rotasGuia)

// Rota de health check
app.get('/api/health', (_, res) => res.json({ sucesso: true, mensagem: 'API Héstia funcionando!' }))

// Fallback para o app (index.html)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(caminhoFrontend, 'index.html'))
})

module.exports = app