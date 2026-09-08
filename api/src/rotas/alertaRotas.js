const { Router } = require('express')
const { listarAlertas, cadastrarAlerta } = require('../controladores/alertaControlador')

const rotas = Router()
rotas.get('/alertas', listarAlertas)
rotas.post('/alertas', cadastrarAlerta)

module.exports = rotas