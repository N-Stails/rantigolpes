const validator = require('validator')

const NIVEIS_RISCO = ['verde', 'amarelo', 'vermelho']
const TIPOS_ANALISE = ['link', 'texto', 'pix', 'telefone', 'email']

// Remove espaços extras e escapa caracteres especiais
function sanitizar(texto) {
  return validator.trim(validator.escape(texto || ''))
}

// Valida e sanitiza uma solicitação de análise de golpe
function validarAnalise(dados) {
  const erros = []
  const tipo = sanitizar(dados.tipo).toLowerCase()
  const conteudo = sanitizar(dados.conteudo)

  if (!TIPOS_ANALISE.includes(tipo))
    erros.push('Tipo de análise inválido. Use "link", "texto", "pix", "telefone" ou "email".')

  if (conteudo.length < 3)
    erros.push('Informe o link, texto, chave Pix, telefone ou e-mail (mínimo de 3 caracteres).')

  if (conteudo.length > 2000)
    erros.push('O conteúdo deve ter no máximo 2000 caracteres.')

  // Validações específicas por tipo
  if (tipo === 'telefone' && conteudo.length > 0) {
    // Verificar se parece um telefone (pelo menos alguns dígitos)
    const digitos = conteudo.replace(/[^\d]/g, '')
    if (digitos.length < 8) {
      erros.push('Telefone deve conter pelo menos 8 dígitos.')
    }
  }

  if (tipo === 'email' && conteudo.length > 0) {
    // Verificar se parece um e-mail (contém @)
    if (!conteudo.includes('@')) {
      erros.push('E-mail deve conter o caractere "@".')
    }
  }

  return { valido: erros.length === 0, erros, dados: { tipo, conteudo } }
}

// Valida e sanitiza um novo alerta de golpe
function validarAlerta(dados) {
  const erros = []
  const titulo = sanitizar(dados.titulo)
  const descricao = sanitizar(dados.descricao)
  const regiao = sanitizar(dados.regiao)
  const categoria = sanitizar(dados.categoria)
  const nivel = sanitizar(dados.nivel_risco)

  if (!titulo || titulo.length < 5 || titulo.length > 150)
    erros.push('Título deve ter entre 5 e 150 caracteres.')

  if (!descricao || descricao.length < 10 || descricao.length > 2000)
    erros.push('Descrição deve ter entre 10 e 2000 caracteres.')

  if (!regiao || regiao.length > 100)
    erros.push('Informe a região do alerta (máximo 100 caracteres).')

  if (!categoria || categoria.length > 50)
    erros.push('Informe a categoria do alerta (máximo 50 caracteres).')

  if (!NIVEIS_RISCO.includes(nivel))
    erros.push('Nível de risco inválido. Use "verde", "amarelo" ou "vermelho".')

  return { valido: erros.length === 0, erros, dados: { titulo, descricao, regiao, categoria, nivel_risco: nivel } }
}

module.exports = { sanitizar, validarAnalise, validarAlerta }