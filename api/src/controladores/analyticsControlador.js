const banco = require('../config/conexaoBanco')

function textoLimitado(valor, limite = 80) {
  return typeof valor === 'string' ? valor.replace(/[\r\n\t]/g, ' ').trim().slice(0, limite) : null
}

function identificarDispositivo(ua) {
  if (!ua) return 'desconhecido'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  if (/mobile|android|iphone/i.test(ua)) return 'mobile'
  return 'desktop'
}

function identificarNavegador(ua) {
  if (!ua) return 'desconhecido'
  if (/edg\//i.test(ua)) return 'Edge'
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/opr\//i.test(ua)) return 'Opera'
  if (/chrome|chromium/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Outro'
}

function identificarSistema(ua) {
  if (!ua) return 'desconhecido'
  if (/windows/i.test(ua)) return 'Windows'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS'
  if (/linux/i.test(ua)) return 'Linux'
  if (/mac os/i.test(ua)) return 'macOS'
  return 'Outro'
}

function origemSegura(valor) {
  if (typeof valor !== 'string' || valor.length > 255) return null
  try {
    const url = new URL(valor)
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null
  } catch {
    return null
  }
}

function detalhesPermitidos(detalhes) {
  if (!detalhes || typeof detalhes !== 'object') return null
  const permitido = {}
  for (const chave of ['risk', 'type', 'language', 'size', 'active', 'alert_id', 'step']) {
    if (detalhes[chave] !== undefined) {
      const valor = detalhes[chave]
      if (['string', 'number', 'boolean'].includes(typeof valor)) permitido[chave] = valor
    }
  }
  return Object.keys(permitido).length ? JSON.stringify(permitido).slice(0, 500) : null
}

function registrarEvento(req, res) {
  const corpo = req.body || {}
  if (typeof corpo.sessao !== 'string' || !/^[-a-zA-Z0-9]{8,128}$/.test(corpo.sessao)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Sessão inválida.' })
  }
  if (!['page_view', 'tab_change', 'analysis_completed', 'alert_listened', 'guide_step_listened', 'language_change', 'accessibility_font_change', 'accessibility_contrast_change'].includes(corpo.tipo)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Evento inválido.' })
  }

  const sessaoId = textoLimitado(corpo.sessao, 128)
  const ua = req.headers['user-agent'] || ''
  const idioma = textoLimitado(corpo.idioma || req.headers['x-hestia-language'], 10)
  const origem = origemSegura(corpo.origem)
  const dispositivo = identificarDispositivo(ua)
  const navegador = identificarNavegador(ua)
  const sistema = identificarSistema(ua)

  const existente = banco.prepare('SELECT id FROM analytics_sessoes WHERE id = ?').get(sessaoId)
  if (!existente) {
    banco.prepare(`
      INSERT INTO analytics_sessoes (id, idioma, origem, dispositivo, navegador, sistema, recorrente)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(sessaoId, idioma, origem, dispositivo, navegador, sistema)
  } else {
    banco.prepare("UPDATE analytics_sessoes SET ultimo_acesso = datetime('now','localtime'), recorrente = 1 WHERE id = ?").run(sessaoId)
  }

  banco.prepare(`
    INSERT INTO analytics_eventos (sessao_id, tipo, pagina, idioma, detalhes)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessaoId, corpo.tipo, textoLimitado(corpo.pagina, 40), idioma, detalhesPermitidos(corpo.detalhes))

  res.status(204).end()
}

function excluirSessaoAnalytics(req, res) {
  const sessaoId = typeof req.body?.sessao === 'string' ? req.body.sessao : ''
  if (!/^[-a-zA-Z0-9]{8,128}$/.test(sessaoId)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Sessão inválida.' })
  }
  const excluir = banco.transaction((id) => {
    banco.prepare('DELETE FROM analytics_eventos WHERE sessao_id = ?').run(id)
    banco.prepare('DELETE FROM analytics_sessoes WHERE id = ?').run(id)
  })
  excluir(sessaoId)
  res.status(204).end()
}

function metricas(req, res) {
  const periodoPermitido = ['7', '30', '90']
  const periodo = periodoPermitido.includes(req.query.periodo) ? req.query.periodo : '30'
  const limiarEventos = `datetime('now', '-${periodo} days')`
  const visitantes = banco.prepare(`
    SELECT COUNT(*) AS total FROM analytics_sessoes
    WHERE ultimo_acesso >= ${limiarEventos}
  `).get().total
  const recorrentes = banco.prepare(`
    SELECT COUNT(*) AS total FROM analytics_sessoes
    WHERE recorrente = 1 AND ultimo_acesso >= ${limiarEventos}
  `).get().total
  const eventos = banco.prepare(`
    SELECT COUNT(*) AS total FROM analytics_eventos
    WHERE criado_em >= ${limiarEventos}
  `).get().total
  const paginas = banco.prepare(`
    SELECT pagina, COUNT(*) AS total FROM analytics_eventos
    WHERE tipo = 'page_view' AND pagina IS NOT NULL AND criado_em >= ${limiarEventos}
    GROUP BY pagina ORDER BY total DESC LIMIT 20
  `).all()
  const dispositivos = banco.prepare(`
    SELECT dispositivo, COUNT(*) AS total FROM analytics_sessoes
    WHERE dispositivo IS NOT NULL AND ultimo_acesso >= ${limiarEventos}
    GROUP BY dispositivo ORDER BY total DESC
  `).all()
  const navegadores = banco.prepare(`
    SELECT navegador, COUNT(*) AS total FROM analytics_sessoes
    WHERE navegador IS NOT NULL AND ultimo_acesso >= ${limiarEventos}
    GROUP BY navegador ORDER BY total DESC
  `).all()
  const sistemas = banco.prepare(`
    SELECT sistema, COUNT(*) AS total FROM analytics_sessoes
    WHERE sistema IS NOT NULL AND ultimo_acesso >= ${limiarEventos}
    GROUP BY sistema ORDER BY total DESC
  `).all()
  const idiomas = banco.prepare(`
    SELECT idioma, COUNT(*) AS total FROM analytics_sessoes
    WHERE idioma IS NOT NULL AND ultimo_acesso >= ${limiarEventos}
    GROUP BY idioma ORDER BY total DESC
  `).all()
  const recentes = banco.prepare(`
    SELECT tipo, pagina, idioma, criado_em
    FROM analytics_eventos
    WHERE criado_em >= ${limiarEventos}
    ORDER BY id DESC LIMIT 50
  `).all()
  const analises = banco.prepare(`
    SELECT COUNT(*) AS total FROM estatisticas_analise
    WHERE criado_em >= ${limiarEventos}
  `).get().total
  const erros = banco.prepare(`
    SELECT COUNT(*) AS total FROM analytics_eventos
    WHERE tipo LIKE '%error%' AND criado_em >= ${limiarEventos}
  `).get().total
  const atualizadaEm = banco.prepare(`
    SELECT COALESCE(MAX(criado_em), datetime('now','localtime')) AS valor
    FROM analytics_eventos
  `).get().valor

  res.json({
    sucesso: true,
    dados: {
      periodo,
      atualizadaEm,
      visitantes,
      recorrentes,
      eventos,
      analises,
      erros,
      paginas,
      dispositivos,
      navegadores,
      sistemas,
      idiomas,
      recentes
    }
  })
}

module.exports = { registrarEvento, excluirSessaoAnalytics, metricas }
