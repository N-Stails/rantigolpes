const NOME_MODELO_PADRAO = 'llama3.2:1b'
const URL_OLLAMA_PADRAO = 'http://127.0.0.1:11434'

function extrairJson(texto) {
  if (typeof texto !== 'string') return null
  const limpo = texto.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(limpo)
  } catch {
    const inicio = limpo.indexOf('{')
    const fim = limpo.lastIndexOf('}')
    if (inicio >= 0 && fim > inicio) {
      try {
        return JSON.parse(limpo.slice(inicio, fim + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

function criarPrompt(conteudo, tipo, resultadoLocal, idioma) {
  const instrucoesIdioma = {
    'pt-BR': 'Responda em português brasileiro.',
    en: 'Respond in English.',
    es: 'Responde en español.'
  }
  return [{
    role: 'system',
    content: [
      'Você é um analisador de prevenção contra golpes digitais.',
      instrucoesIdioma[idioma] || instrucoesIdioma['pt-BR'],
      'Não use probabilidades, pontuações ou afirmações absolutas.',
      'Não identifique pessoas nem titulares de dados.',
      'Uma chave Pix isolada não é evidência de golpe.',
      'Urgência ou pagamento isolados podem indicar atenção, não prova.',
      'Retorne somente JSON válido, sem markdown.',
      'Formato: {"classificacao":"risco_identificado|atencao_necessaria|inconclusivo","indicadores":[{"nome":"texto curto","descricao":"explicação"}],"informacoes_neutras":[{"nome":"texto curto","descricao":"explicação"}],"confianca":{"nivel":"baixa|moderada","justificativa":"explicação"}}'
    ].join('\n')
  }, {
    role: 'user',
    content: `Tipo: ${tipo}\nConteúdo: ${String(conteudo).slice(0, 2000)}\n\nResultado local auxiliar: ${JSON.stringify({
      classificacao: resultadoLocal.classificacao,
      indicadores: resultadoLocal.regras_detalhes,
      neutros: resultadoLocal.itens_nao_suspeitos
    }).slice(0, 6000)}`
  }]
}

function resultadoValido(resultado) {
  return resultado
    && ['risco_identificado', 'atencao_necessaria', 'inconclusivo'].includes(resultado.classificacao)
    && Array.isArray(resultado.indicadores)
    && Array.isArray(resultado.informacoes_neutras)
    && ['baixa', 'moderada'].includes(resultado.confianca?.nivel)
    && typeof resultado.confianca?.justificativa === 'string'
}

async function analisarComIA(conteudo, tipo, resultadoLocal, idioma) {
  if (process.env.IA_ENABLED !== 'true') {
    return { resultado: resultadoLocal, metodo: 'heuristica_local', fontes: [], ia_disponivel: false }
  }

  const provider = (process.env.IA_PROVIDER || 'ollama').toLowerCase()
  const url = provider === 'ollama'
    ? `${process.env.OLLAMA_URL || URL_OLLAMA_PADRAO}/api/chat`
    : null

  if (!url) {
    return { resultado: resultadoLocal, metodo: 'heuristica_local', fontes: [], ia_disponivel: false }
  }

  const mensagens = criarPrompt(conteudo, tipo, resultadoLocal, idioma)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.IA_TIMEOUT_MS || 30000))

  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || NOME_MODELO_PADRAO,
        messages: mensagens,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.1,
          num_predict: 700
        }
      }),
      signal: controller.signal
    })
    if (!resposta.ok) {
      return { resultado: resultadoLocal, metodo: 'heuristica_local', fontes: [], ia_disponivel: false }
    }

    const dados = await resposta.json()
    const parsed = extrairJson(dados.message?.content)
    if (!resultadoValido(parsed)) {
      return { resultado: resultadoLocal, metodo: 'heuristica_local', fontes: [], ia_disponivel: false }
    }

    const indicadores = parsed.indicadores
      .slice(0, 12)
      .filter((item) => item && typeof item.nome === 'string' && typeof item.descricao === 'string')
      .map((item) => ({
        nome: item.nome.slice(0, 80),
        descricao: item.descricao.slice(0, 500)
      }))
    const neutros = parsed.informacoes_neutras
      .slice(0, 12)
      .filter((item) => item && typeof item.nome === 'string' && typeof item.descricao === 'string')
      .map((item) => ({
        nome: item.nome.slice(0, 80),
        descricao: item.descricao.slice(0, 500),
        risco: 'neutro'
      }))

    const risco = parsed.classificacao === 'risco_identificado'
      ? 'vermelho'
      : parsed.classificacao === 'atencao_necessaria'
        ? 'amarelo'
        : 'cinza'

    return {
      resultado: {
        ...resultadoLocal,
        risco,
        classificacao: parsed.classificacao,
        regras_atingidas: indicadores.map((item) => item.nome),
        regras_detalhes: indicadores,
        itens_nao_suspeitos: neutros,
        resumo: parsed.classificacao === 'risco_identificado'
          ? 'A análise de IA identificou indicadores relevantes para investigação.'
          : parsed.classificacao === 'atencao_necessaria'
            ? 'A análise de IA encontrou possíveis indicadores, mas não é conclusiva.'
            : 'A análise de IA não encontrou informações suficientes para uma conclusão.',
        confianca: {
          nivel: parsed.confianca.nivel,
          justificativa: parsed.confianca.justificativa.slice(0, 500)
        }
      },
      metodo: 'ia_local_ollama',
      fontes: [],
      ia_disponivel: true
    }
  } catch {
    return { resultado: resultadoLocal, metodo: 'heuristica_local', fontes: [], ia_disponivel: false }
  } finally {
    clearTimeout(timeout)
  }
}

module.exports = { analisarComIA, extrairJson }
