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

function analisar(conteudo, tipo) {
  const entrada = String(conteudo || '').trim()
  let resultado

  if (tipo === 'link') resultado = avaliarLink(entrada)
  else if (tipo === 'texto') resultado = avaliarTexto(entrada)
  else if (tipo === 'pix') resultado = avaliarPix(entrada)
  else resultado = { pontuacao: 0, regras: [] }

  const risco = resultado.pontuacao >= 4 ? 'vermelho' : resultado.pontuacao >= 2 ? 'amarelo' : 'verde'

  const resumo = resultado.regras.some((r) => !r.nome.startsWith('pix_') || resultado.pontuacao > 0)
    && resultado.pontuacao > 0
    ? `Possíveis sinais de golpe encontrados: ${resultado.regras.slice(0, 3).map((r) => r.descricao).join(' ')}`
    : 'Nenhum sinal evidente de golpe foi identificado.'

  return {
    risco,
    regras_atingidas: [...new Set(resultado.regras.map((r) => r.nome))],
    regras_detalhes: resultado.regras,
    resumo
  }
}

module.exports = { analisar, avaliarLink, avaliarTexto, avaliarPix }