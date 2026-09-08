const ENCURTADORES = [
  'bit.ly', 'tinyurl.com', 't.ly', 'is.gd', 'cutt.ly', 'rebrand.ly',
  'shorte.st', 'goo.gl', 'ow.ly', 'shorturl.at', 'buff.ly', 'rb.gy', 's.id'
]

const TLD_SUSPEITOS = ['tk', 'xyz', 'top', 'online', 'site', 'click', 'ru', 'cn', 'buzz', 'vip', 'win', 'icu', 'cf', 'gq', 'ml', 'ga']

const MARCAS_INSTITUICOES = [
  'banco', 'bradesco', 'itau', 'santander', 'nubank', 'caixa',
  'gov', 'receita', 'serasa', 'paypal', 'whatsapp', 'instagram', 'facebook', 'bb'
]

const PALAVRAS_ALTO_RISCO = [
  'urgente', 'imediatamente', 'premio', 'ganhou', 'confirmar', 'atualizar', 'atualize',
  'desbloquear', 'verificar', 'validacao', 'senha', 'token', 'cartao', 'codigo',
  'conta bloqueada', 'pagamento bloqueado', 'chave pix', 'renda extra', 'dinheiro facil',
  'investimento garantido', 'lucro garantido', 'deposite', 'transferencia',
  'clique no link', 'copie e cole', 'pix liberado', 'liberacao', 'urgente!!!'
]

const PALAVRAS_MEDIO_RISCO = [
  'parabens', 'sorteio', 'promocao', 'desconto', 'oferta', 'emprego', 'home office',
  'rendimentos', 'lucro', 'oportunidade', 'bonus', 'premiacao'
]

// Importações para análise de telefone e e-mail
const {
  DDDS_BRASIL,
  CODIGOS_NAO_GEOGRAFICOS,
  CODIGOS_PAISES,
  normalizarTelefone,
  extrairDDD,
  classificarTipoNumero,
  verificarRepeticao,
  validarEstrutura
} = require('../config/codigosNacionais')

const {
  classificarDominio,
  verificarTyposquatting,
  extrairDominio,
  extrairLocalPart
} = require('../config/dominiosEmail')

// Extrai possíveis URLs do conteúdo (com ou sem protocolo)
function extrairUrls(texto) {
  const encontradas = []
  const regex = /((?:https?:\/\/)?(?:www\.)?[a-z0-9\u00e0-\u00ff.-]+\.(?:[a-z]{2,63})(?:\/[^\s"<>]*)?)/gi
  let match
  while ((match = regex.exec(texto)) !== null) {
    encontradas.push(match[1])
  }
  return encontradas
}

function detalhesDaUrl(url) {
  const limpo = url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase().replace(/^www\./, '')
  const partes = limpo.split('.')
  const tld = partes[partes.length - 1]
  const dominio = partes.length >= 2 ? partes.slice(-2).join('.') : limpo
  return { limpo, tld, dominio }
}

function avaliarLink(url) {
  const regras = []
  let pontuacao = 0
  const aplicar = (condicao, nome, descricao, peso) => {
    if (condicao) { regras.push({ nome, descricao }); pontuacao += peso }
  }

  const { limpo, tld, dominio } = detalhesDaUrl(url)

  aplicar(ENCURTADORES.some((s) => limpo.includes(s)), 'encurtador',
    'Link encurtado, usado em golpes para esconder o destino real.', 3)
  aplicar(/^http:\/\//i.test(url), 'sem_https',
    'O link usa HTTP sem HTTPS, sem conexão segura.', 2)
  aplicar(TLD_SUSPEITOS.includes(tld), 'tld_suspeito',
    `Domínio em extensão incomum (.${tld}).`, 2)
  aplicar(/\d{3,}/.test(limpo), 'numeros_dominio',
    'Domínio com muitos números, padrão de páginas falsas.', 1)

  const marcas = MARCAS_INSTITUICOES.filter((m) => limpo.includes(m))
  const temHifen = limpo.includes('-')
  aplicar(marcas.length > 0 && temHifen, 'marca_alterada',
    `Parece usar o nome de instituição conhecida de forma alterada (${marcas.join(', ')}).`, 3)
  aplicar(marcas.length > 0 && marcas.some((m) => limpo.includes(`${m}-`)), 'marca_com_prefixo',
    'Nome de instituição com prefixo suspeito no domínio.', 2)

  return { pontuacao, regras }
}

function avaliarTexto(texto) {
  const regras = []
  let pontuacao = 0
  const aplicar = (condicao, nome, descricao, peso) => {
    if (condicao) { regras.push({ nome, descricao }); pontuacao += peso }
  }

  const textoMin = texto.toLowerCase()
  const alto = PALAVRAS_ALTO_RISCO.filter((p) => textoMin.includes(p))
  const medio = PALAVRAS_MEDIO_RISCO.filter((p) => textoMin.includes(p))

  aplicar(alto.length > 0, 'urgencia_ou_pedido',
    `Contém termos típicos de golpe: ${alto.slice(0, 3).join(', ')}`, alto.length >= 3 ? 3 : 2)
  aplicar(medio.length > 0 && alto.length === 0, 'oferta_tentadora',
    `Contém termos de ofertas chamativas: ${medio.slice(0, 3).join(', ')}`, 1)

  const caps = (texto.match(/[A-ZÀ-Ú]{3,}/g) || []).length
  aplicar(caps >= 2 && texto.length >= 40, 'caixa_alta',
    'Muito texto em MAIÚSCULAS, típico de mensagens de urgência.', 1)

  const exclamacoes = (texto.match(/!/g) || []).length
  aplicar(exclamacoes >= 3, 'muitas_exclamacoes',
    'Uso exagerado de exclamações, comum em apelos emocionais.', 1)

  aplicar(/(cpf|cnpj|senha|token|pix|cart[aã]o|conta banc[aá]ria|codigo de acesso)/i.test(texto),
    'pedido_dados', 'A mensagem solicita dados sensíveis (CPF, senha, cartão).', 3)

  aplicar(/pague|taxa|deposito|transferir|boleto/i.test(texto),
    'pedido_pagamento', 'A mensagem pede pagamento, taxa ou transferência.', 2)

  const urls = extrairUrls(texto)
  if (urls.length > 0) {
    const r = avaliarLink(urls[0])
    pontuacao += r.pontuacao
    regras.push(...r.regras.map((x) => ({ ...x, descricao: `Link na mensagem: ${x.descricao}` })))
  }

  return { pontuacao, regras }
}

function cpfValido(cpf) {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i], 10) * (10 - i)
  let resto = ((soma * 10) % 11) % 10
  if (resto !== parseInt(nums[9], 10)) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i], 10) * (11 - i)
  resto = ((soma * 10) % 11) % 10
  return resto === parseInt(nums[10], 10)
}

function avaliarPix(conteudo) {
  const regras = []
  let pontuacao = 0
  const aplicar = (condicao, nome, descricao, peso) => {
    if (condicao) { regras.push({ nome, descricao }); pontuacao += peso }
  }

  const digitos = conteudo.replace(/[^0-9]/g, '')
  const textoMin = conteudo.toLowerCase()

  if (conteudo.includes('@')) {
    const urlCompleta = conteudo.replace(/.*@/, '')
    const { limpo } = detalhesDaUrl(urlCompleta.includes('.') ? urlCompleta : '')
    aplicar(limpo === '' || ENCURTADORES.some((s) => limpo.includes(s)) || TLD_SUSPEITOS.some((t) => limpo.endsWith(`.${t}`)),
      'pix_email_suspeito', 'Chave Pix por e-mail em domínio incomum.', 3)
  } else if (/^\d{11}$/.test(digitos) && cpfValido(digitos)) {
    regras.push({ nome: 'pix_cpf', descricao: 'Chave Pix do tipo CPF.' })
  } else if (/^\d{10,11}$/.test(digitos)) {
    regras.push({ nome: 'pix_telefone', descricao: 'Chave Pix do tipo telefone.' })
  } else if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(conteudo.trim())) {
    regras.push({ nome: 'pix_aleatoria', descricao: 'Chave Pix aleatória (token).' })
  } else {
    aplicar(pontuacao === 0, 'pix_formato_desconhecido', 'Formato não reconhecido como chave Pix válida.', 1)
  }

  const alto = PALAVRAS_ALTO_RISCO.filter((p) => textoMin.includes(p))
  aplicar(alto.length > 0, 'instrucoes_suspeitas',
    `Texto acompanhando a chave contém termos de golpe: ${alto.slice(0, 3).join(', ')}`, 3)

  return { pontuacao, regras }
}

// Função para analisar telefone
function avaliarTelefone(telefone) {
  const regras = []
  let pontuacao = 0
  const aplicar = (condicao, nome, descricao, peso) => {
    if (condicao) { regras.push({ nome, descricao }); pontuacao += peso }
  }

  // Normalizar o telefone
  const normalizado = normalizarTelefone(telefone)
  
  // Validar estrutura
  const estrutura = validarEstrutura(telefone)
  if (!estrutura.valido) {
    for (const erro of estrutura.erros) {
      if (erro.includes('DDD')) {
        aplicar(true, 'telefone_ddd_invalido', 'DDD não é um código nacional válido.', 2)
      } else if (erro.includes('dígitos')) {
        aplicar(true, 'telefone_formato_invalido', 'Quantidade de dígitos fora do padrão.', 2)
      }
    }
  }

  // Classificar tipo de número
  const tipoNumero = classificarTipoNumero(telefone)
  
  // Verificar código não geográfico
  if (tipoNumero.tipo === 'nao_geografico') {
    regras.push({ 
      nome: 'telefone_codigo_nao_geografico', 
      descricao: `Número do tipo ${tipoNumero.info.descricao}.` 
    })
  }

  // Verificar se é internacional
  if (tipoNumero.tipo === 'internacional') {
    regras.push({ 
      nome: 'telefone_internacional', 
      descricao: `Número internacional (${tipoNumero.pais.pais}).` 
    })
  }

  // Verificar DDD
  const ddd = extrairDDD(telefone)
  if (ddd && DDDS_BRASIL[ddd]) {
    const infoDdd = DDDS_BRASIL[ddd]
    regras.push({ 
      nome: 'telefone_ddd_identificado', 
      descricao: `DDD ${ddd} (${infoDdd.estado} - ${infoDdd.regiao}).` 
    })
  }

  // Verificar repetição
  const repeticao = verificarRepeticao(telefone)
  if (repeticao.repetitivo) {
    aplicar(true, 'telefone_numero_repetitivo', `Número com padrão repetitivo: ${repeticao.motivo}.`, 1)
  }

  // Verificar contexto suspeito (se houver texto associado)
  const textoMin = telefone.toLowerCase()
  
  // Urgência
  aplicar(/urgente|imediatamente|agora|rapido|so hoje/i.test(textoMin), 
    'telefone_contexto_urgente', 'Mensagem com linguagem de urgência.', 1)
  
  // Pedido de código/senha
  aplicar(/codigo|senha|token|verificacao|validacao/i.test(textoMin), 
    'telefone_contexto_codigo_seguranca', 'Solicitação de código ou senha.', 2)
  
  // Pagamento
  aplicar(/pagar|pagamento|pix|transferencia|boleto|deposito/i.test(textoMin), 
    'telefone_contexto_pagamento', 'Solicitação de pagamento ou transferência.', 2)
  
  // Prêmio
  aplicar(/premio|ganhou|sorteio|parabens|voce foi selecionado/i.test(textoMin), 
    'telefone_contexto_premio', 'Mensagem sobre prêmio ou sorteio.', 2)
  
  // Banco/Instituição
  aplicar(/banco|bradesco|itau|santander|caixa|nubank|receita federal|serasa/i.test(textoMin), 
    'telefone_contexto_banco', 'Menção a instituição financeira ou governo.', 2)

  return { pontuacao, regras, informacoes: { ddd, tipo: tipoNumero.tipo } }
}

// Função para analisar e-mail
function avaliarEmail(email) {
  const regras = []
  let pontuacao = 0
  const aplicar = (condicao, nome, descricao, peso) => {
    if (condicao) { regras.push({ nome, descricao }); pontuacao += peso }
  }

  // Extrair partes do e-mail
  const dominio = extrairDominio(email)
  const localPart = extrairLocalPart(email)
  
  if (!dominio || !localPart) {
    aplicar(true, 'email_sintaxe_invalida', 'Formato de e-mail inválido.', 2)
    return { pontuacao, regras, informacoes: {} }
  }

  // Verificar sintaxe básica
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) {
    aplicar(true, 'email_sintaxe_invalida', 'E-mail contém caracteres ou formatação inválida.', 2)
  }

  // Verificar domínio
  if (!dominio.includes('.')) {
    aplicar(true, 'email_dominio_malformado', 'Domínio parece incompleto ou malformado.', 2)
  }

  // Classificar domínio
  const classificacaoDominio = classificarDominio(dominio)
  
  // Verificar se é descartável
  if (classificacaoDominio.categoria === 'descartavel') {
    aplicar(true, 'email_dominio_descartavel', 'E-mail em provedor de uso temporário/descartável.', 2)
  }

  // Verificar typosquatting/impersonação
  const typosquatting = verificarTyposquatting(dominio)
  if (typosquatting.suspeito) {
    aplicar(true, 'email_possivel_typosquatting', 
      `Possível tentativa de impersonação de ${typosquatting.organizacao}: ${typosquatting.motivo}.`, 3)
  }

  // Verificar caracteres suspeitos no local-part
  if (localPart.length > 30) {
    aplicar(true, 'email_local_part_longo', 'Parte local do e-mail é excessivamente longa.', 1)
  }

  // Verificar números excessivos no local-part
  const numerosLocalPart = (localPart.match(/\d/g) || []).length
  if (numerosLocalPart > localPart.length * 0.5 && localPart.length > 5) {
    aplicar(true, 'email_local_part_numeroso', 'E-mail contém muitos números na parte local.', 1)
  }

  // Verificar repetição no local-part
  if (/^(.+)\1{2,}$/.test(localPart)) {
    aplicar(true, 'email_local_part_repetitivo', 'Padrão repetitivo detectado na parte local.', 1)
  }

  // Verificar termos suspeitos no local-part
  const termosSuspeitos = ['premio', 'ganhou', 'sorteio', 'urgente', 'pagar', 'cobranca', 'banco', 'senha', 'token']
  const termosEncontrados = termosSuspeitos.filter(t => localPart.includes(t))
  if (termosEncontrados.length > 0) {
    aplicar(true, 'email_local_part_suspeito', 
      `E-mail contém termos associados a golpes: ${termosEncontrados.slice(0, 3).join(', ')}.`, 1)
  }

  // Verificar se é provedor gratuito (não é suspeito por si só)
  if (classificacaoDominio.categoria === 'gratuito') {
    regras.push({ 
      nome: 'email_provedor_gratuito', 
      descricao: 'E-mail em provedor gratuito (não é suspeito por si só).' 
    })
  }

  // Verificar TLD suspeito
  const partes = dominio.split('.')
  const tld = partes[partes.length - 1]
  if (['tk', 'xyz', 'top', 'online', 'site', 'click', 'ru', 'cn'].includes(tld)) {
    aplicar(true, 'email_dominio_suspeito', `Domínio em extensão incomum (.${tld}).`, 1)
  }

  // Verificar se há contexto suspeito (se houver texto associado)
  const textoMin = email.toLowerCase()
  
  // Urgência
  aplicar(/urgente|imediatamente|agora|rapido|so hoje/i.test(textoMin), 
    'email_contexto_urgente', 'Mensagem com linguagem de urgência.', 1)
  
  // Pedido de código/senha
  aplicar(/codigo|senha|token|verificacao|validacao/i.test(textoMin), 
    'email_contexto_codigo_seguranca', 'Solicitação de código ou senha.', 2)
  
  // Pagamento
  aplicar(/pagar|pagamento|pix|transferencia|boleto|deposito/i.test(textoMin), 
    'email_contexto_pagamento', 'Solicitação de pagamento ou transferência.', 2)
  
  // Prêmio
  aplicar(/premio|ganhou|sorteio|parabens|voce foi selecionado/i.test(textoMin), 
    'email_contexto_premio', 'Mensagem sobre prêmio ou sorteio.', 2)
  
  // Banco/Instituição
  aplicar(/banco|bradesco|itau|santander|caixa|nubank|receita federal|serasa/i.test(textoMin), 
    'email_contexto_banco', 'Menção a instituição financeira ou governo.', 2)

  return { pontuacao, regras, informacoes: { dominio, categoria_dominio: classificacaoDominio.categoria } }
}

function analisar(conteudo, tipo) {
  const entrada = String(conteudo || '').trim()
  let resultado
  let informacoes = {}

  if (tipo === 'link') resultado = avaliarLink(entrada)
  else if (tipo === 'texto') resultado = avaliarTexto(entrada)
  else if (tipo === 'pix') resultado = avaliarPix(entrada)
  else if (tipo === 'telefone') {
    resultado = avaliarTelefone(entrada)
    informacoes = resultado.informacoes || {}
  }
  else if (tipo === 'email') {
    resultado = avaliarEmail(entrada)
    informacoes = resultado.informacoes || {}
  }
  else resultado = { pontuacao: 0, regras: [] }

  const risco = resultado.pontuacao >= 4 ? 'vermelho' : resultado.pontuacao >= 2 ? 'amarelo' : 'verde'

  const resumo = resultado.regras.some((r) => !r.nome.startsWith('pix_') || resultado.pontuacao > 0)
    && resultado.pontuacao > 0
    ? `Possíveis sinais de golpe encontrados: ${resultado.regras.slice(0, 3).map((r) => r.descricao).join(' ')}`
    : 'Nenhum sinal evidente de golpe foi identificado.'

  const resultadoFinal = {
    risco,
    regras_atingidas: [...new Set(resultado.regras.map((r) => r.nome))],
    regras_detalhes: resultado.regras,
    resumo
  }

  // Adicionar informações se houver
  if (Object.keys(informacoes).length > 0) {
    resultadoFinal.informacoes = informacoes
  }

  return resultadoFinal
}

module.exports = { analisar, avaliarLink, avaliarTexto, avaliarPix, avaliarTelefone, avaliarEmail }