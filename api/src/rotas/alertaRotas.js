const { Router } = require('express')
const { listarAlertas, cadastrarAlerta } = require('../controladores/alertaControlador')
const adminAuth = require('../middleware/adminAuth')

const rotas = Router()
rotas.get('/alertas', listarAlertas)
rotas.post('/alertas', adminAuth, cadastrarAlerta)

module.exports = rotas