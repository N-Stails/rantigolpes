const banco = require('../config/conexaoBanco')
const { validarAlerta } = require('../utilitarios/validadores')

// Central de Alertas (RF4): lista golpes da semana por região/categoria
function listarAlertas(req, res) {
  const { regiao, categoria } = req.query
  const clausulas = []
  const params = []

  if (regiao) { clausulas.push('regiao = ?'); params.push(regiao) }
  if (categoria) { clausulas.push('categoria = ?'); params.push(categoria) }

  let sql = 'SELECT * FROM alertas_golpes'
  if (clausulas.length) sql += ` WHERE ${clausulas.join(' AND ')}`
  sql += ' ORDER BY data_publicacao DESC, id DESC LIMIT 50'

  const alertas = banco.prepare(sql).all(...params)
  res.json({ sucesso: true, dados: alertas })
}

// Cadastra um novo alerta de golpe (uso administrativo)
function cadastrarAlerta(req, res) {
  const { valido, erros, dados } = validarAlerta(req.body)
  if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Dados inválidos.', erros })

  const inserir = banco.prepare(
    'INSERT INTO alertas_golpes (titulo, descricao, regiao, categoria, nivel_risco) VALUES (?, ?, ?, ?, ?)'
  )
  inserir.run(dados.titulo, dados.descricao, dados.regiao, dados.categoria, dados.nivel_risco)

  res.status(201).json({ sucesso: true, mensagem: 'Alerta cadastrado com sucesso!' })
}

module.exports = { listarAlertas, cadastrarAlerta }