const validator = require('validator')

const NIVEIS_RISCO = ['verde', 'amarelo', 'vermelho']
const TIPOS_ANALISE = ['link', 'texto', 'pix']

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
    erros.push('Tipo de análise inválido. Use "link", "texto" ou "pix".')

  if (conteudo.length < 3)
    erros.push('Informe o link, texto ou chave Pix (mínimo de 3 caracteres).')

  if (conteudo.length > 2000)
    erros.push('O conteúdo deve ter no máximo 2000 caracteres.')

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
  const fonte = sanitizar(dados.fonte)
  const fonteUrlRaw = typeof dados.fonte_url === 'string' ? validator.trim(dados.fonte_url) : ''
  const fonteUrl = fonteUrlRaw
  const dataOcorrencia = sanitizar(dados.data_ocorrencia)
  const situacao = sanitizar(dados.situacao)
  const verificadoEm = sanitizar(dados.verificado_em)
  const situacoes = ['em_monitoramento', 'confirmado', 'descartado', 'atualizado']

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
  if (fonte.length > 150)
    erros.push('A fonte deve ter no máximo 150 caracteres.')
  if (fonteUrl && !/^https?:\/\//i.test(fonteUrl))
    erros.push('A URL da fonte deve começar com http:// ou https://.')
  if (fonteUrl.length > 500)
    erros.push('A URL da fonte deve ter no máximo 500 caracteres.')
  if (situacao && !situacoes.includes(situacao))
    erros.push('Situação de alerta inválida.')
  for (const data of [dataOcorrencia, verificadoEm]) {
    if (data && !/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2})?$/.test(data))
      erros.push('Data inválida.')
  }

  return {
    valido: erros.length === 0,
    erros,
    dados: {
      titulo, descricao, regiao, categoria, nivel_risco: nivel,
      fonte: fonte || null, fonte_url: fonteUrl || null,
      data_ocorrencia: dataOcorrencia || null,
      situacao: situacao || 'em_monitoramento',
      verificado_em: verificadoEm || null
    }
  }
}

module.exports = { sanitizar, validarAnalise, validarAlerta }