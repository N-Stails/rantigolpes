const { Router } = require('express')
const { analisarConteudo } = require('../controladores/analiseControlador')

const rotas = Router()
rotas.post('/analises', analisarConteudo)

module.exports = rotas