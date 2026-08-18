const { Router } = require('express')
const { obterGuia } = require('../controladores/guiaControlador')

const rotas = Router()
rotas.get('/guia', obterGuia)

module.exports = rotas