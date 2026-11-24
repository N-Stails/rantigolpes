const banco = require('../config/conexaoBanco')
const { validarAlerta } = require('../utilitarios/validadores')

function idioma(req) {
  const valor = (req.headers['accept-language'] || '').split(',')[0].toLowerCase()
  if (valor.startsWith('en')) return 'en'
  if (valor.startsWith('es')) return 'es'
  return 'pt-BR'
}

const traducoesAlertas = {
  en: {
    'Falso investimento em criptomoedas': ['Fake cryptocurrency investment', 'Scammers promise high guaranteed cryptocurrency returns and demand Pix deposits. No legitimate investment guarantees fixed profit.'],
    'Falsa central de atendimento bancário': ['Fake bank customer service', 'Calls impersonating a bank ask for confirmation of data or installation of apps. Banks never request passwords or tokens by phone.'],
    'Falso emprego home-office': ['Fake remote job', 'Job offers with very high salaries ask for a fee to guarantee hiring. Legitimate employers do not charge candidates.'],
    'Pix bloqueado por "erro de cadastro"': ['Pix blocked by a “registration error”', 'Messages say your Pix account is blocked and ask you to update data through a link. Banks do not update data through SMS or WhatsApp links.'],
    'Prêmio ou sorteio falso no WhatsApp': ['Fake prize or raffle on WhatsApp', 'Messages claim you won a prize and ask for personal data or a fee. Be suspicious of unsolicited prizes.'],
    'Golpe do "falso sequestro" com voz clonada': ['Fake kidnapping scam with a cloned voice', 'AI is used to clone a relative’s voice and request emergency money. Use a family code word to confirm calls.'],
    'Falsas promoções de lojas clonadas': ['Fake promotions from cloned stores', 'Sponsored social media ads lead to fake stores with unbelievable prices. Check the domain and tax ID before paying.'],
    'Golpe da falsa vaga no INSS': ['Fake INSS job or benefit scam', 'People posing as INSS agents ask for data or deposits to “unlock” retirement benefits. INSS does not call requesting Pix or passwords.']
  },
  es: {
    'Falso investimento em criptomoedas': ['Falsa inversión en criptomonedas', 'Los estafadores prometen altos rendimientos garantizados y exigen depósitos por Pix. Ninguna inversión legítima garantiza una ganancia fija.'],
    'Falsa central de atendimento bancário': ['Falsa central de atención bancaria', 'Llamadas que se hacen pasar por el banco solicitan datos o instalación de aplicaciones. El banco nunca pide contraseñas o tokens por teléfono.'],
    'Falso emprego home-office': ['Falsa oferta de empleo remoto', 'Ofertas con salarios muy altos cobran una tasa para “garantizar” la contratación. Los empleos legítimos no cobran al candidato.'],
    'Pix bloqueado por "erro de cadastro"': ['Pix bloqueado por un “error de registro”', 'Los mensajes dicen que su Pix está bloqueado y solicitan actualizar datos mediante un enlace. El banco no actualiza datos por enlaces de SMS o WhatsApp.'],
    'Prêmio ou sorteio falso no WhatsApp': ['Falso premio o sorteo en WhatsApp', 'Los mensajes dicen que ganó un premio y solicitan datos personales o una tasa. Desconfíe de premios no solicitados.'],
    'Golpe do "falso sequestro" com voz clonada': ['Estafa de falso secuestro con voz clonada', 'Se usa IA para clonar la voz de familiares y pedir dinero de emergencia. Use una palabra clave acordada para confirmar llamadas.'],
    'Falsas promoções de lojas clonadas': ['Falsas promociones de tiendas clonadas', 'Anuncios patrocinados llevan a tiendas falsas con precios irreales. Comprueba el dominio y el CNPJ antes de pagar.'],
    'Golpe da falsa vaga no INSS': ['Estafa de falsa oferta del INSS', 'Supuestos agentes del INSS solicitan datos o depósitos para desbloquear una jubilación. El INSS no pide Pix ni contraseñas por teléfono.']
  }
}

// Central de Alertas (RF4): lista golpes da semana por região/categoria
function listarAlertas(req, res) {
  const { regiao, categoria, q, ordenar } = req.query
  const clausulas = []
  const params = []

  if (regiao) { clausulas.push('regiao = ?'); params.push(regiao) }
  if (categoria) { clausulas.push('categoria = ?'); params.push(categoria) }
  if (q) {
    clausulas.push('(titulo LIKE ? OR descricao LIKE ? OR categoria LIKE ? OR regiao LIKE ?)')
    const busca = `%${String(q).slice(0, 100)}%`
    params.push(busca, busca, busca, busca)
  }

  let sql = 'SELECT * FROM alertas_golpes'
  if (clausulas.length) sql += ` WHERE ${clausulas.join(' AND ')}`
  if (ordenar === 'gravidade') {
    sql += " ORDER BY CASE nivel_risco WHEN 'vermelho' THEN 1 WHEN 'amarelo' THEN 2 ELSE 3 END, data_publicacao DESC, id DESC LIMIT 50"
  } else {
    sql += ' ORDER BY COALESCE(data_ocorrencia, data_publicacao) DESC, id DESC LIMIT 50'
  }

  const alertas = banco.prepare(sql).all(...params)
  const idiomaSelecionado = idioma(req)
  const dados = idiomaSelecionado === 'pt-BR'
    ? alertas
    : alertas.map((alerta) => {
        const traducao = traducoesAlertas[idiomaSelecionado][alerta.titulo]
        return traducao ? { ...alerta, titulo: traducao[0], descricao: traducao[1] } : alerta
    })
  res.json({ sucesso: true, dados })
}

// Cadastra um novo alerta de golpe (uso administrativo)
function cadastrarAlerta(req, res) {
  const { valido, erros, dados } = validarAlerta(req.body)
  if (!valido) return res.status(422).json({ sucesso: false, mensagem: 'Dados inválidos.', erros })

  const inserir = banco.prepare(
    `INSERT INTO alertas_golpes
      (titulo, descricao, regiao, categoria, nivel_risco, fonte, fonte_url, data_ocorrencia, situacao, verificado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  inserir.run(dados.titulo, dados.descricao, dados.regiao, dados.categoria, dados.nivel_risco,
    dados.fonte, dados.fonte_url, dados.data_ocorrencia, dados.situacao, dados.verificado_em)

  res.status(201).json({ sucesso: true, mensagem: 'Alerta cadastrado com sucesso!' })
}

module.exports = { listarAlertas, cadastrarAlerta }