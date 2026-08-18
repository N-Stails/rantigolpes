const banco = require('../config/conexaoBanco')
const { analisar } = require('../utilitarios/analisadorGolpes')
const { validarAnalise } = require('../utilitarios/validadores')

// Realiza a triagem heurística de link, texto ou chave Pix (RF1/RF2)
// Objetivo: resposta em até 3 segundos (RNF2). Nenhum conteúdo é persistido (RNF3/LGPD).
function analisarConteudo(req, res) {
  const { valido, erros, dados } = validarAnalise(req.body)
  if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Dados inválidos.', erros })

  const inicio = Date.now()
  const resultado = analisar(dados.conteudo, dados.tipo)

  // Métrica anônima: apenas metadados, nunca o conteúdo analisado
  const registrar = banco.prepare(
    'INSERT INTO estatisticas_analise (tipo_entrada, risco, regras_atingidas) VALUES (?, ?, ?)'
  )
  registrar.run(dados.tipo, resultado.risco, resultado.regras_atingidas.join(','))

  res.status(200).json({
    sucesso: true,
    ...resultado,
    tempo_ms: Date.now() - inicio
  })
}

module.exports = { analisarConteudo }