const banco = require('../config/conexaoBanco')
const { analisar } = require('../utilitarios/analisadorGolpes')
const { validarAnalise } = require('../utilitarios/validadores')
const { analisarComIA } = require('../utilitarios/analisadorIA')

function idiomaAceito(req) {
  const valor = (req.headers['accept-language'] || '').split(',')[0].trim()
  if (valor.startsWith('en')) return 'en'
  if (valor.startsWith('es')) return 'es'
  return 'pt-BR'
}

function traduzirResultado(resultado, idioma) {
  if (idioma === 'pt-BR') return resultado
  const textos = idioma === 'en'
    ? {
        semSinais: 'No clear signs of a scam were identified.',
        sinais: 'Possible signs of a scam were found.',
        inconclusivo: 'There is not enough information to evaluate this content.',
        atencao: 'Suspicious indicators were found, but a conclusion cannot be established.',
        risco: 'Relevant indicators were found for investigation.',
        encurtador: 'Shortened link that hides the real destination.',
        sem_https: 'The link uses HTTP without a secure HTTPS connection.',
        tld_suspeito: 'Unusual or suspicious domain extension.',
        numeros_dominio: 'Domain containing many numbers, typical of fake pages.',
        marca_alterada: 'Appears to impersonate a known institution.',
        urgencia_ou_pedido: 'Contains typical scam words and requests urgency.',
        oferta_tentadora: 'Contains tempting offer language.',
        caixa_alta: 'Excessive capital letters, typical of urgent messages.',
        muitas_exclamacoes: 'Excessive exclamation marks, common in emotional appeals.',
        pedido_dados: 'The message requests sensitive data (CPF, password or card).',
        pedido_pagamento: 'The message requests payment, fee or transfer.',
        pix_email_suspeito: 'Pix email key using an unusual domain.',
        pix_cpf: 'Pix key of CPF type.',
        pix_telefone: 'Pix key of phone type.',
        pix_aleatoria: 'Random Pix key (token).',
        pix_formato_desconhecido: 'Format not recognized as a valid Pix key.',
        instrucoes_suspeitas: 'Text accompanying the key contains scam terms.',
        urgencia: 'The message uses urgent or pressing language.',
        caixa_alta: 'Excessive capital letters, typical of urgent messages.',
        muitas_exclamacoes: 'Excessive exclamation marks, common in emotional appeals.',
        oferta_tentadora: 'There is an excessively advantageous offer or guaranteed-profit promise.',
        termos_genericos: 'Isolated words such as “raffle” or “promotion” are not evidence of a scam on their own.'
      }
    : {
        semSinais: 'No se identificaron señales evidentes de estafa.',
        sinais: 'Se encontraron posibles señales de estafa.',
        inconclusivo: 'No hay información suficiente para evaluar este contenido.',
        atencao: 'Se encontraron indicadores sospechosos, pero no es posible establecer una conclusión.',
        risco: 'Se encontraron indicadores relevantes para investigar.',
        encurtador: 'Enlace acortado que oculta el destino real.',
        sem_https: 'El enlace usa HTTP sin una conexión HTTPS segura.',
        tld_suspeito: 'Extensión de dominio inusual o sospechosa.',
        numeros_dominio: 'Dominio con muchos números, típico de páginas falsas.',
        marca_alterada: 'Parece usar el nombre de una institución conocida de forma falsa.',
        urgencia_ou_pedido: 'Contiene términos típicos de estafa y solicita urgencia.',
        oferta_tentadora: 'Contiene lenguaje de ofertas tentadoras.',
        caixa_alta: 'Uso excesivo de mayúsculas, típico de mensajes urgentes.',
        muitas_exclamacoes: 'Uso exagerado de signos de exclamación.',
        pedido_dados: 'El mensaje solicita datos sensibles (CPF, contraseña o tarjeta).',
        pedido_pagamento: 'El mensaje solicita pago, tarifa o transferencia.',
        pix_email_suspeito: 'Clave Pix por correo electrónico en un dominio inusual.',
        pix_cpf: 'Clave Pix del tipo CPF.',
        pix_telefone: 'Clave Pix del tipo teléfono.',
        pix_aleatoria: 'Clave Pix aleatoria (token).',
        pix_formato_desconhecido: 'Formato no reconocido como clave Pix válida.',
        instrucoes_suspeitas: 'El texto que acompaña la clave contiene términos sospechosos.',
        urgencia: 'El mensaje usa lenguaje urgente o presionante.',
        caixa_alta: 'Uso excesivo de mayúsculas, típico de mensajes urgentes.',
        muitas_exclamacoes: 'Uso exagerado de signos de exclamación.',
        oferta_tentadora: 'Hay una oferta excesivamente ventajosa o promesa de ganancia garantizada.',
        termos_genericos: 'Palabras aisladas como “sorteo” o “promoción” no son por sí solas evidencia de estafa.'
      }
  const detalhes = (resultado.regras_detalhes || []).map((detalhe) => ({
    ...detalhe,
    descricao: textos[detalhe.nome] || detalhe.descricao
  }))
  const neutros = (resultado.itens_nao_suspeitos || []).map((item) => ({
    ...item,
    descricao: textos[item.nome] || item.descricao
  }))
  const traduzirResumo = resultado.classificacao === 'risco_identificado'
    ? textos.risco
    : resultado.classificacao === 'atencao_necessaria'
      ? textos.atencao
      : textos.inconclusivo
  const confianca = resultado.confianca && idioma === 'en'
    ? {
        nivel: resultado.confianca.nivel === 'moderada' ? 'moderate' : 'low',
        justificativa: 'This is a local heuristic analysis and does not prove fraud.'
      }
    : resultado.confianca && idioma === 'es'
      ? {
          nivel: resultado.confianca.nivel === 'moderada' ? 'moderada' : 'baja',
          justificativa: 'Este análisis local heurístico no demuestra fraude.'
        }
      : resultado.confianca
  return {
    ...resultado,
    resumo: traduzirResumo,
    regras_detalhes: detalhes,
    itens_nao_suspeitos: neutros,
    confianca
  }
}

// Realiza a triagem heurística de link, texto ou chave Pix (RF1/RF2)
// Objetivo: resposta em até 3 segundos (RNF2). Nenhum conteúdo é persistido (RNF3/LGPD).
async function analisarConteudo(req, res) {
  const { valido, erros, dados } = validarAnalise(req.body)
  if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Dados inválidos.', erros })

  const inicio = Date.now()
  const resultadoLocal = analisar(dados.conteudo, dados.tipo)
  const idioma = idiomaAceito(req)
  const analiseIA = await analisarComIA(dados.conteudo, dados.tipo, resultadoLocal, idioma)
  const resultado = analiseIA.resultado
  resultado.modo_analise = analiseIA.metodo
  resultado.fontes_consultadas = analiseIA.fontes
  resultado.ia_disponivel = analiseIA.ia_disponivel

  // Métrica anônima: apenas metadados, nunca o conteúdo analisado
  const registrar = banco.prepare(
    'INSERT INTO estatisticas_analise (tipo_entrada, risco, regras_atingidas) VALUES (?, ?, ?)'
  )
  registrar.run(dados.tipo, resultado.risco, resultado.regras_atingidas.join(','))

  const resultadoTraduzido = traduzirResultado(resultado, idioma)

  res.status(200).json({
    sucesso: true,
    ...resultadoTraduzido,
    tempo_ms: Date.now() - inicio
  })
}

module.exports = { analisarConteudo }