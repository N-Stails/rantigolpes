// Domínios de e-mail categorizados por tipo
// IMPORTANTE: Ausência na lista nunca significa confiabilidade
// Provedores gratuitos não são suspeitos por si só

const DOMINIOS_EMAIL = {
  // Provedores gratuitos comuns (não são suspeitos por si só)
  gratuitos: [
    'gmail.com', 'yahoo.com', 'yahoo.com.br', 'hotmail.com', 'hotmail.com.br',
    'outlook.com', 'outlook.com.br', 'live.com', 'live.com.br', 'msn.com',
    'aol.com', 'icloud.com', 'me.com', 'mac.com',
    'protonmail.com', 'proton.me', 'tutanota.com', 'tutanota.de',
    'mail.com', 'email.com', 'gmx.com', 'gmx.de',
    'zoho.com', 'yandex.com', 'yandex.ru',
    '163.com', '126.com', 'qq.com',
    'rediffmail.com', 'lycos.com', 'att.net',
    'terra.com.br', 'uol.com.br', 'bol.com.br', 'ig.com.br', 'r7.com',
    'globo.com', 'oglobo.com'
  ],

  // Domínios educacionais (.edu, .edu.br)
  educacionais: [
    'edu', 'edu.br', 'ac.uk', 'edu.au', 'edu.cn',
    'usp.br', 'unicamp.br', 'ufrj.br', 'ufmg.br', 'usp.br',
    'unifesp.br', 'unicid.br', 'puc-rio.br', 'puc-sp.br',
    'fapesp.br', 'cnpq.br', 'capes.gov.br'
  ],

  // Domínios governamentais (.gov, .gov.br)
  governamentais: [
    'gov', 'gov.br', 'gov.pt', 'gov.uk', 'gov.au',
    'serasa.gov.br', 'receita.gov.br', 'casa.gov.br',
    'prefeitura.sp.gov.br', 'prefeitura.rio.gov.br',
    'seguranca.gov.br', 'mj.gov.br', 'pf.gov.br'
  ],

  // Domínios corporativos/institucionais comuns
  corporativos: [
    'empresa.com.br', 'negocio.com.br', 'comercio.com.br',
    'consultoria.com.br', 'assessoria.com.br',
    'banco.com.br', 'seguradora.com.br'
  ],

  // Domínios de descartáveis/temporários (alta suspeita quando usados para cadastro)
  descartaveis: [
    'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'guerrillamail.de',
    'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz',
    'mailinator.com', 'yopmail.com', 'yopmail.fr',
    'trashmail.com', 'trashmail.net', 'trashmail.org',
    'dispostable.com', 'maildrop.cc', 'mailnesia.com',
    'tempr.email', '10minutemail.com', 'minutemail.com',
    'mohmal.com', 'fakeinbox.com', 'sharklasers.com',
    'guerrillamailblock.com', 'grr.la', 'dispostable.com',
    'mytemp.email', 'tempmailo.com', 'tmpmail.net',
    'throwam.com', 'tmpmailer.com'
  ],

  // TLDs comuns para domínios normais
  tlds_normais: [
    'com', 'com.br', 'org', 'org.br', 'net', 'net.br',
    'info', 'info.br', 'biz', 'biz.br',
    'co', 'co.uk', 'io', 'me', 'tv'
  ],

  // TLDs potencialmente suspeitos (não são automaticamente golpe, mas requerem atenção)
  tlds_suspeitos: [
    'tk', 'xyz', 'top', 'online', 'site', 'click', 'ru', 'cn',
    'buzz', 'vip', 'win', 'icu', 'cf', 'gq', 'ml', 'ga',
    'work', 'date', 'racing', 'download', 'stream', 'accountant',
    'science', 'party', 'gdn', 'bid', 'webcam', 'loan', 'cricket',
    'link', 'live', 'monster', 'ninja', 'pizza', 'surf', 'tokyo'
  ]
}

// Organizações conhecidas para detecção de impersonação
// Usado para identificar typosquatting e domains semelhantes
const ORGANIZACOES_CONHECIDAS = {
  bancos: [
    {
      nome: 'Banco do Brasil',
      dominios_oficiais: ['bb.com.br'],
      termos_associados: ['banco', 'bb', 'banco do brasil'],
      variantes_comuns: ['banco-brasil.com', 'bb-seguro.com', 'banco-br.com']
    },
    {
      nome: 'Bradesco',
      dominios_oficiais: ['bradesco.com.br', 'bradesco.com'],
      termos_associados: ['bradesco', 'brd'],
      variantes_comuns: ['bradesco-seguro.com', 'brd.com.br', 'bradesco.net']
    },
    {
      nome: 'Itaú',
      dominios_oficiais: ['itau.com.br', 'itau.com'],
      termos_associados: ['itau', 'itaú'],
      variantes_comuns: ['itau-seguro.com', 'itau.com.com', 'itau.net.br']
    },
    {
      nome: 'Santander',
      dominios_oficiais: ['santander.com.br', 'santander.com'],
      termos_associados: ['santander', 'santander'],
      variantes_comuns: ['santander-seguro.com', 'santander.com.com', 'santander.net']
    },
    {
      nome: 'Caixa Econômica',
      dominios_oficiais: ['caixa.gov.br'],
      termos_associados: ['caixa', 'cef', 'caixa economica'],
      variantes_comuns: ['caixa-seguro.com', 'caixa.com.br', 'cef.com.br']
    },
    {
      nome: 'Nubank',
      dominios_oficiais: ['nubank.com.br', 'nubank.com'],
      termos_associados: ['nubank', 'nu'],
      variantes_comuns: ['nubank-seguro.com', 'nu-bank.com', 'nubank.net']
    }
  ],

 gov: [
    {
      nome: 'Receita Federal',
      dominios_oficiais: ['gov.br', 'rfb.gov.br', 'receita.gov.br'],
      termos_associados: ['receita', 'rfb', 'cnpj', 'cpf', 'imposto'],
      variantes_comuns: ['receita-gov.com', 'gov-br.com', 'receita-seguro.com']
    },
    {
      nome: 'IBGE',
      dominios_oficiais: ['ibge.gov.br'],
      termos_associados: ['ibge', 'censo', 'estatistica'],
      variantes_comuns: ['ibge-seguro.com', 'ibge.com.br']
    }
  ],

  tech: [
    {
      nome: 'Google',
      dominios_oficiais: ['google.com', 'google.com.br', 'gmail.com'],
      termos_associados: ['google', 'gmail', 'googlemail'],
      variantes_comuns: ['google-seguro.com', 'g00gle.com', 'google.com.com']
    },
    {
      nome: 'Microsoft',
      dominios_oficiais: ['microsoft.com', 'outlook.com', 'hotmail.com', 'live.com'],
      termos_associados: ['microsoft', 'outlook', 'hotmail', 'windows'],
      variantes_comuns: ['microsoft-seguro.com', 'micr0soft.com', 'outlook-seguro.com']
    },
    {
      nome: 'Apple',
      dominios_oficiais: ['apple.com', 'icloud.com'],
      termos_associados: ['apple', 'icloud', 'iphone', 'mac'],
      variantes_comuns: ['apple-seguro.com', 'app1e.com', 'icloud-seguro.com']
    }
  ],

  redes_sociais: [
    {
      nome: 'WhatsApp',
      dominios_oficiais: ['whatsapp.com', 'whatsapp.net'],
      termos_associados: ['whatsapp', 'whats'],
      variantes_comuns: ['whatsapp-seguro.com', 'whats-app.com', 'whatsapp.com.com']
    },
    {
      nome: 'Instagram',
      dominios_oficiais: ['instagram.com'],
      termos_associados: ['instagram', 'insta'],
      variantes_comuns: ['instagram-seguro.com', 'instagrarn.com', 'instagram.com.com']
    },
    {
      nome: 'Facebook',
      dominios_oficiais: ['facebook.com', 'fb.com'],
      termos_associados: ['facebook', 'fb', 'meta'],
      variantes_comuns: ['facebook-seguro.com', 'faceb00k.com', 'fb-seguro.com']
    }
  ]
}

// Função para classificar domínio de e-mail
function classificarDominio(dominio) {
  if (!dominio) return { categoria: 'desconhecido', confiavel: false }

  const dominioLower = dominio.toLowerCase()

  // Verificar se é descartável
  if (DOMINIOS_EMAIL.descartaveis.includes(dominioLower)) {
    return { categoria: 'descartavel', confiavel: false }
  }

  // Verificar se é gratuito
  if (DOMINIOS_EMAIL.gratuitos.includes(dominioLower)) {
    return { categoria: 'gratuito', confiavel: true }
  }

  // Verificar se é educacional
  if (DOMINIOS_EMAIL.educacionais.some(e => dominioLower.endsWith(`.${e}`) || dominioLower === e)) {
    return { categoria: 'educacional', confiavel: true }
  }

  // Verificar se é governamental
  if (DOMINIOS_EMAIL.governamentais.some(g => dominioLower.endsWith(`.${g}`) || dominioLower === g)) {
    return { categoria: 'governamental', confiavel: true }
  }

  // Verificar TLD
  const partes = dominioLower.split('.')
  const tld = partes[partes.length - 1]
  const tldCompleto = partes.slice(-2).join('.')

  if (DOMINIOS_EMAIL.tlds_suspeitos.includes(tld) || DOMINIOS_EMAIL.tlds_suspeitos.includes(tldCompleto)) {
    return { categoria: 'dominio_suspeito', confiavel: false }
  }

  // Verificar se é corporativo (qualquer outro domínio)
  if (DOMINIOS_EMAIL.tlds_normais.includes(tld) || DOMINIOS_EMAIL.tlds_normais.includes(tldCompleto)) {
    return { categoria: 'corporativo', confiavel: true }
  }

  return { categoria: 'desconhecido', confiavel: false }
}

// Função para verificar typosquatting (aproximação de domínio conhecido)
function verificarTyposquatting(dominio) {
  if (!dominio) return { suspeito: false }

  const dominioLower = dominio.toLowerCase()
  const partes = dominioLower.split('.')
  const dominioBase = partes.length >= 2 ? partes.slice(-2)[0] : dominioLower

  // Verificar em todas as organizações conhecidas
  for (const categoria of Object.values(ORGANIZACOES_CONHECIDAS)) {
    for (const org of categoria) {
      // Verificar se está na lista de variantes conhecidas
      if (org.variantes_comuns.includes(dominioLower)) {
        return {
          suspeito: true,
          organizacao: org.nome,
          motivo: 'Domínio conhecido como variante fraudulenta'
        }
      }

      // Verificar se contém termos da organização mas não é domínio oficial
      const contemTermo = org.termos_associados.some(t => dominioLower.includes(t))
      const ehOficial = org.dominios_oficiais.some(d => dominioLower.endsWith(d) || dominioLower === d)

      if (contemTermo && !ehOficial) {
        // Calcular distância de edição (simplificada)
        const editDistance = calcularDistanciaEdicao(dominioBase, org.dominios_oficiais[0].split('.')[0])
        if (editDistance <= 2 && editDistance > 0) {
          return {
            suspeito: true,
            organizacao: org.nome,
            motivo: `Parece ser uma aproximação do domínio oficial (${org.dominios_oficiais[0]})`
          }
        }
      }
    }
  }

  return { suspeito: false }
}

// Função auxiliar para calcular distância de edição (Levenshtein simplificada)
function calcularDistanciaEdicao(str1, str2) {
  const m = str1.length
  const n = str2.length
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

// Função para extrair domínio de e-mail
function extrairDominio(email) {
  if (!email || !email.includes('@')) return null
  const partes = email.split('@')
  return partes.length === 2 ? partes[1].toLowerCase() : null
}

// Função para extrair local-part (antes do @)
function extrairLocalPart(email) {
  if (!email || !email.includes('@')) return null
  const partes = email.split('@')
  return partes.length === 2 ? partes[0].toLowerCase() : null
}

module.exports = {
  DOMINIOS_EMAIL,
  ORGANIZACOES_CONHECIDAS,
  classificarDominio,
  verificarTyposquatting,
  extrairDominio,
  extrairLocalPart,
  calcularDistanciaEdicao
}