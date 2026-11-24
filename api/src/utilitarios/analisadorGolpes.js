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

  return { pontuacao, regras, neutros: [] }
}

function avaliarTexto(texto) {
  const regras = []
  let pontuacao = 0
  const neutros = []
  const aplicar = (condicao, nome, descricao, peso) => {
    if (condicao) { regras.push({ nome, descricao }); pontuacao += peso }
  }

  const textoMin = texto.toLowerCase()
  const alto = PALAVRAS_ALTO_RISCO.filter((p) => textoMin.includes(p))
  const medio = PALAVRAS_MEDIO_RISCO.filter((p) => textoMin.includes(p))
  const urgencia = /(urgente|urgência|urgencia|imediat[a|o]|agora|não espere|prazo curto)/i.test(texto)
  const pedidoSenha = /(envie|informe|confirme|compartilhe|mande).{0,30}(senha|token|c[oó]digo|cpf|conta banc[aá]ria)/i.test(texto)
  const pedidoPagamento = /(?:pague|pagamento|taxa|dep[oó]sito|transferir|boleto|pix).{0,30}(?:agora|hoje|urgente|para liberar|para confirmar|me pague)|(?:urgente|imediato).{0,30}(?:pague|pagamento|dep[oó]sito|transferir|pix)/i.test(texto)
  const ameacaBloqueio = /(bloque(?:ado|ada|ar)|cancel(?:ado|ada|ar)|encerr(?:ado|ada|ar)).{0,40}(conta|cart[aã]o|pix|acesso)|(?:conta|cart[aã]o|pix|acesso).{0,40}(bloque(?:ado|ada|ar)|cancel(?:ado|ada|ar))/i.test(texto)
  const codigoAutenticacao = /(n[aã]o compartilhe|jamais informe|envie|confirme|digite|informe).{0,30}(c[oó]digo.{0,15}(sms|otp|autentica)|sms|otp|token)/i.test(texto)
  const contornoSeguranca = /(bypass|ignorar.{0,20}(seguran[cç]a|senha)|desativar.{0,20}(seguran[cç]a|antiv[ií]rus)|usar.{0,20}(aplicativo|app).{0,20}(suporte|remoto))/i.test(texto)
  const ofertaChamativa = /renda extra|dinheiro f[aá]cil|lucro garantido|investimento garantido|ganhe.{0,20}por dia/i.test(texto)

  aplicar(urgencia, 'urgencia', 'A mensagem usa linguagem de urgência.', 1)
  aplicar(pedidoSenha, 'pedido_dados', 'Há solicitação ou confirmação de dados sensíveis ou credenciais.', 3)
  aplicar(pedidoPagamento, 'pedido_pagamento', 'Há pressão para realizar pagamento ou transferência.', 2)
  aplicar(ameacaBloqueio, 'ameaca_bloqueio', 'A mensagem ameaça bloquear ou cancelar conta, cartão, Pix ou acesso.', 2)
  aplicar(codigoAutenticacao, 'codigo_autenticacao', 'Há pedido de código de autenticação, SMS ou token.', 4)
  aplicar(contornoSeguranca, 'contorno_seguranca', 'Há instrução para contornar proteções ou mecanismos normais de segurança.', 4)
  aplicar(ofertaChamativa, 'oferta_tentadora', 'Há promessa excessivamente vantajosa ou lucro garantido.', 2)
  if (medio.length > 0 && !ofertaChamativa && alto.length > 0) {
    neutros.push({ nome: 'termos_genericos', descricao: 'Palavras isoladas como “sorteio” ou “promoção” não são, por si só, evidência de golpe.', risco: 'neutro' })
  }

  const caps = (texto.match(/[A-ZÀ-Ú]{3,}/g) || []).length
  aplicar(caps >= 2 && texto.length >= 40, 'caixa_alta',
    'Muito texto em MAIÚSCULAS, típico de mensagens de urgência.', 1)

  const exclamacoes = (texto.match(/!/g) || []).length
  aplicar(exclamacoes >= 3, 'muitas_exclamacoes',
    'Uso exagerado de exclamações, comum em apelos emocionais.', 1)

  const urls = extrairUrls(texto)
  if (urls.length > 0) {
    const r = avaliarLink(urls[0])
    pontuacao += r.pontuacao
    regras.push(...r.regras.map((x) => ({ ...x, descricao: `Link na mensagem: ${x.descricao}` })))
  }

  return { pontuacao, regras, neutros }
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
  const neutros = []
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
    neutros.push({ nome: 'pix_cpf', descricao: 'Chave Pix válida do tipo CPF identificada.', risco: 'neutro' })
  } else if (/^\d{10,11}$/.test(digitos)) {
    neutros.push({ nome: 'pix_telefone', descricao: 'Chave Pix do tipo telefone identificada.', risco: 'neutro' })
  } else if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(conteudo.trim())) {
    neutros.push({ nome: 'pix_aleatoria', descricao: 'Chave Pix aleatória identificada.', risco: 'neutro' })
  } else {
    neutros.push({
      nome: 'pix_formato_desconhecido',
      descricao: 'Formato não reconhecido como chave Pix válida.',
      risco: 'neutro'
    })
  }

  const alto = PALAVRAS_ALTO_RISCO.filter((p) => textoMin.includes(p))
  aplicar(alto.length > 0 && /(senha|token|c[oó]digo|urgente|pague|taxa|transferir)/i.test(textoMin),
    'instrucoes_suspeitas',
    'A instrução acompanhando a chave combina termos de urgência ou solicitação sensível.', 3)

  return { pontuacao, regras, neutros }
}

function analisar(conteudo, tipo) {
  const entrada = String(conteudo || '').trim()
  let resultado

  if (tipo === 'link' && entrada) {
    const validaUrlBasica = /^(https?:\/\/)/i.test(entrada)
    const temDominio = /^https?:\/\/[^/\s]+(?:\/.*)?$/i.test(entrada)
    if (!validaUrlBasica || !temDominio) {
      return {
        risco: 'cinza',
        classificacao: 'inconclusivo',
        regras_atingidas: [],
        regras_detalhes: [],
        itens_nao_suspeitos: [{ nome: 'url_invalida', descricao: 'A URL está incompleta ou não pôde ser interpretada.', risco: 'neutro' }],
        resumo: 'Não existem informações suficientes para uma conclusão sobre este conteúdo.',
        confianca: { nivel: 'baixa', justificativa: 'O endereço não contém estrutura suficiente para avaliação.' },
        modo_analise: 'heuristica_local',
        fontes_consultadas: [],
        data_hora_analise: new Date().toISOString()
      }
    }
  }

  if (tipo === 'link') resultado = avaliarLink(entrada)
  else if (tipo === 'texto') resultado = avaliarTexto(entrada)
  else if (tipo === 'pix') resultado = avaliarPix(entrada)
  else resultado = { pontuacao: 0, regras: [] }

  const regrasSuspeitas = (resultado.regras || []).filter((regra) => !regra.neutro)
  const itensNeutros = (resultado.neutros || []).concat(
    (resultado.regras || []).filter((regra) => regra.neutro).map((regra) => ({ ...regra, risco: 'neutro' }))
  )
  const temContexto = entrada.length >= 3
  let classificacao
  let risco
  if (!temContexto) {
    classificacao = 'inconclusivo'
    risco = 'cinza'
  } else if (resultado.pontuacao >= 4) {
    classificacao = 'risco_identificado'
    risco = 'vermelho'
  } else if (resultado.pontuacao >= 1 || regrasSuspeitas.length > 0) {
    classificacao = 'atencao_necessaria'
    risco = 'amarelo'
  } else if (itensNeutros.length > 0) {
    classificacao = 'inconclusivo'
    risco = 'cinza'
  } else {
    classificacao = 'inconclusivo'
    risco = 'cinza'
  }

  let confianca = 'baixa'
  let justificativaConfianca = 'Há poucos elementos ou ausência de contexto suficiente para uma conclusão.'
  if (regrasSuspeitas.length >= 2 || resultado.pontuacao >= 5) {
    confianca = 'moderada'
    justificativaConfianca = 'A combinação de vários indicadores sustenta a classificação, mas não comprova fraude.'
  } else if (regrasSuspeitas.length === 1 && resultado.pontuacao >= 3) {
    confianca = 'moderada'
    justificativaConfianca = 'Um indicador contextual relevante foi identificado.'
  }

  const resumo = classificacao === 'risco_identificado'
    ? `Foram identificados ${regrasSuspeitas.length} indicador${regrasSuspeitas.length === 1 ? '' : 'es'} relevantes para investigação.`
    : classificacao === 'atencao_necessaria'
      ? 'Existem indicadores suspeitos, mas ainda não há informações suficientes para uma conclusão.'
      : 'Não existem informações suficientes para uma conclusão sobre este conteúdo.'

  return {
    risco,
    classificacao,
    regras_atingidas: [...new Set(regrasSuspeitas.map((r) => r.nome))],
    regras_detalhes: regrasSuspeitas,
    itens_nao_suspeitos: itensNeutros,
    resumo,
    confianca: {
      nivel: confianca,
      justificativa: justificativaConfianca
    },
    modo_analise: 'heuristica_local',
    fontes_consultadas: [],
    data_hora_analise: new Date().toISOString()
  }
}

module.exports = { analisar, avaliarLink, avaliarTexto, avaliarPix }