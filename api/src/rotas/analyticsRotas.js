const { Router } = require('express')
const { registrarEvento, excluirSessaoAnalytics, metricas } = require('../controladores/analyticsControlador')
const adminAuth = require('../middleware/adminAuth')

const rotas = Router()

rotas.post('/analytics/events', registrarEvento)
rotas.post('/analytics/revoke', excluirSessaoAnalytics)
rotas.get('/analytics/metrics', adminAuth, metricas)

module.exports = rotas
