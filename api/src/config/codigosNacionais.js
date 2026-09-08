// Códigos DDD brasileiros - Regiões e UFs associadas
// Fonte: ANATEL - Agência Nacional de Telecomunicações
// IMPORTANTE: DDD identifica área de numeração, não localização atual do titular
// Portabilidade impede inferir a operadora atual pelo número

const DDDS_BRASIL = {
  // Região Sudeste
  '11': { estado: 'SP', regiao: 'Sudeste', ufs: ['SP'] },
  '12': { estado: 'SP', regiao: 'Sudeste', ufs: ['SP'] },
  '13': { estado: 'SP', regiao: 'Sudeste', ufs: ['SP'] },
  '14': { estado: 'SP', regiao: 'Sudeste', ufs: ['SP'] },
  '15': { estado: 'SP', regiao: 'Sudeste', ufs: ['SP'] },
  '16': { estado: 'SP', regiao: 'Sudeste', ufs: ['SP'] },
  '17': { estado: 'SP', regiao: 'Sudeste', ufs: ['SP'] },
  '18': { estado: 'SP', regiao: 'Sudeste', ufs: ['SP'] },
  '19': { estado: 'SP', regiao: 'Sudeste', ufs: ['SP'] },
  '21': { estado: 'RJ', regiao: 'Sudeste', ufs: ['RJ'] },
  '22': { estado: 'RJ', regiao: 'Sudeste', ufs: ['RJ'] },
  '24': { estado: 'RJ', regiao: 'Sudeste', ufs: ['RJ'] },
  '27': { estado: 'ES', regiao: 'Sudeste', ufs: ['ES'] },
  '28': { estado: 'ES', regiao: 'Sudeste', ufs: ['ES'] },
  '31': { estado: 'MG', regiao: 'Sudeste', ufs: ['MG'] },
  '32': { estado: 'MG', regiao: 'Sudeste', ufs: ['MG'] },
  '33': { estado: 'MG', regiao: 'Sudeste', ufs: ['MG'] },
  '34': { estado: 'MG', regiao: 'Sudeste', ufs: ['MG'] },
  '35': { estado: 'MG', regiao: 'Sudeste', ufs: ['MG'] },
  '37': { estado: 'MG', regiao: 'Sudeste', ufs: ['MG'] },
  '38': { estado: 'MG', regiao: 'Sudeste', ufs: ['MG'] },

  // Região Nordeste
  '41': { estado: 'PR', regiao: 'Sul', ufs: ['PR'] },
  '42': { estado: 'PR', regiao: 'Sul', ufs: ['PR'] },
  '43': { estado: 'PR', regiao: 'Sul', ufs: ['PR'] },
  '44': { estado: 'PR', regiao: 'Sul', ufs: ['PR'] },
  '45': { estado: 'PR', regiao: 'Sul', ufs: ['PR'] },
  '46': { estado: 'PR', regiao: 'Sul', ufs: ['PR'] },
  '47': { estado: 'SC', regiao: 'Sul', ufs: ['SC'] },
  '48': { estado: 'SC', regiao: 'Sul', ufs: ['SC'] },
  '49': { estado: 'SC', regiao: 'Sul', ufs: ['SC'] },
  '51': { estado: 'RS', regiao: 'Sul', ufs: ['RS'] },
  '53': { estado: 'RS', regiao: 'Sul', ufs: ['RS'] },
  '54': { estado: 'RS', regiao: 'Sul', ufs: ['RS'] },
  '55': { estado: 'RS', regiao: 'Sul', ufs: ['RS'] },

  // Região Nordeste
  '61': { estado: 'DF', regiao: 'Centro-Oeste', ufs: ['DF', 'GO'] },
  '62': { estado: 'GO', regiao: 'Centro-Oeste', ufs: ['GO'] },
  '63': { estado: 'TO', regiao: 'Norte', ufs: ['TO'] },
  '64': { estado: 'GO', regiao: 'Centro-Oeste', ufs: ['GO'] },
  '65': { estado: 'MT', regiao: 'Centro-Oeste', ufs: ['MT'] },
  '66': { estado: 'MT', regiao: 'Centro-Oeste', ufs: ['MT'] },
  '67': { estado: 'MS', regiao: 'Centro-Oeste', ufs: ['MS'] },
  '68': { estado: 'AC', regiao: 'Norte', ufs: ['AC'] },
  '69': { estado: 'RO', regiao: 'Norte', ufs: ['RO'] },

  // Região Nordeste
  '71': { estado: 'BA', regiao: 'Nordeste', ufs: ['BA'] },
  '73': { estado: 'BA', regiao: 'Nordeste', ufs: ['BA'] },
  '74': { estado: 'BA', regiao: 'Nordeste', ufs: ['BA'] },
  '75': { estado: 'BA', regiao: 'Nordeste', ufs: ['BA'] },
  '77': { estado: 'BA', regiao: 'Nordeste', ufs: ['BA'] },
  '79': { estado: 'SE', regiao: 'Nordeste', ufs: ['SE'] },
  '81': { estado: 'PE', regiao: 'Nordeste', ufs: ['PE'] },
  '82': { estado: 'AL', regiao: 'Nordeste', ufs: ['AL'] },
  '83': { estado: 'PB', regiao: 'Nordeste', ufs: ['PB'] },
  '84': { estado: 'RN', regiao: 'Nordeste', ufs: ['RN'] },
  '85': { estado: 'CE', regiao: 'Nordeste', ufs: ['CE'] },
  '86': { estado: 'PI', regiao: 'Nordeste', ufs: ['PI'] },
  '87': { estado: 'PE', regiao: 'Nordeste', ufs: ['PE'] },
  '88': { estado: 'CE', regiao: 'Nordeste', ufs: ['CE'] },
  '89': { estado: 'PI', regiao: 'Nordeste', ufs: ['PI'] },

  // Região Norte
  '91': { estado: 'PA', regiao: 'Norte', ufs: ['PA'] },
  '92': { estado: 'AM', regiao: 'Norte', ufs: ['AM'] },
  '93': { estado: 'PA', regiao: 'Norte', ufs: ['PA'] },
  '94': { estado: 'PA', regiao: 'Norte', ufs: ['PA'] },
  '95': { estado: 'RR', regiao: 'Norte', ufs: ['RR'] },
  '96': { estado: 'AP', regiao: 'Norte', ufs: ['AP'] },
  '97': { estado: 'AM', regiao: 'Norte', ufs: ['AM'] },
  '98': { estado: 'MA', regiao: 'Nordeste', ufs: ['MA'] },
  '99': { estado: 'MA', regiao: 'Nordeste', ufs: ['MA'] }
}

// Códigos não geográficos brasileiros
const CODIGOS_NAO_GEOGRAFICOS = {
  '0300': { descricao: 'Serviço de utilidade pública', tipo: 'servico' },
  '0303': { descricao: 'Serviço de atendimento ao consumidor', tipo: 'servico' },
  '0500': { descricao: 'Serviço de informação', tipo: 'servico' },
  '0800': { descricao: 'Ligação gratuita (0800)', tipo: 'gratuito' },
  '0900': { descricao: 'Serviço premium (0900)', tipo: 'premium' }
}

// Países comuns (código de país)
const CODIGOS_PAISES = {
  '+55': { pais: 'Brasil', nome: 'Brasil' },
  '+1': { pais: 'EUA', nome: 'Estados Unidos' },
  '+44': { pais: 'Reino Unido', nome: 'Reino Unido' },
  '+351': { pais: 'Portugal', nome: 'Portugal' },
  '+54': { pais: 'Argentina', nome: 'Argentina' },
  '+56': { pais: 'Chile', nome: 'Chile' },
  '+57': { pais: 'Colômbia', nome: 'Colômbia' },
  '+51': { pais: 'Peru', nome: 'Peru' },
  '+593': { pais: 'Equador', nome: 'Equador' }
}

// Função para normalizar número de telefone
function normalizarTelefone(telefone) {
  if (!telefone) return ''
  
  // Remove caracteres especiais, mantendo apenas dígitos e +
  let normalizado = telefone.replace(/[^\d+]/g, '')
  
  // Se começa com +55, remove (Brasil)
  if (normalizado.startsWith('+55')) {
    normalizado = normalizado.substring(3)
  }
  
  // Se começa com 0055, remove
  if (normalizado.startsWith('0055')) {
    normalizado = normalizado.substring(4)
  }
  
  // Se começa com 0, remove (discagem internacional)
  if (normalizado.startsWith('0') && normalizado.length > 10) {
    normalizado = normalizado.substring(1)
  }
  
  return normalizado
}

// Função para extrair DDD do número
function extrairDDD(numero) {
  const limpo = normalizarTelefone(numero)
  
  // Números brasileiros: 10-11 dígitos (fixo 10, móvel 11)
  if (limpo.length === 10 || limpo.length === 11) {
    return limpo.substring(0, 2)
  }
  
  // Números com código de país: 12-13 dígitos
  if (limpo.length === 12 || limpo.length === 13) {
    return limpo.substring(2, 4)
  }
  
  return null
}

// Função para classificar tipo de número
function classificarTipoNumero(numero) {
  const limpo = normalizarTelefone(numero)
  
  // Verificar se começa com código não geográfico
  for (const codigo of Object.keys(CODIGOS_NAO_GEOGRAFICOS)) {
    if (limpo.startsWith(codigo)) {
      return { tipo: 'nao_geografico', codigo, info: CODIGOS_NAO_GEOGRAFICOS[codigo] }
    }
  }
  
  // Números fixos: 10 dígitos (DDD + 8 dígitos)
  if (limpo.length === 10) {
    return { tipo: 'fixo', formato: 'nacional' }
  }
  
  // Números móveis: 11 dígitos (DDD + 9 dígitos)
  if (limpo.length === 11) {
    return { tipo: 'movel', formato: 'nacional' }
  }
  
  // Números com código de país
  if (limpo.length === 12 || limpo.length === 13) {
    const codigoPais = '+' + limpo.substring(0, 2)
    if (CODIGOS_PAISES[codigoPais]) {
      return { tipo: 'internacional', pais: CODIGOS_PAISES[codigoPais] }
    }
    return { tipo: 'internacional', pais: 'Desconhecido' }
  }
  
  return { tipo: 'invalido', motivo: 'Quantidade de dígitos inválida' }
}

// Função para verificar se o número é repetitivo
function verificarRepeticao(numero) {
  const limpo = normalizarTelefone(numero)
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{9,}$/.test(limpo)) {
    return { repetitivo: true, motivo: 'Todos os dígitos são iguais' }
  }
  
  // Verificar padrões repetitivos (121212, 123123, etc.)
  if (/^(\d{2,3})\1{2,}$/.test(limpo)) {
    return { repetitivo: true, motivo: 'Padrão de repetição detectado' }
  }
  
  return { repetitivo: false }
}

// Função para identificar se o número é válido estruturalmente
function validarEstrutura(numero) {
  const limpo = normalizarTelefone(numero)
  const erros = []
  
  // Verificar caracteres inválidos
  if (/[^\d+]/.test(numero.replace(/\s/g, ''))) {
    erros.push('Contém caracteres não numéricos')
  }
  
  // Verificar DDD inválido
  const ddd = extrairDDD(numero)
  if (ddd && !DDDS_BRASIL[ddd]) {
    // Não é necessarily inválido se for internacional
    const tipo = classificarTipoNumero(numero)
    if (tipo.tipo !== 'internacional') {
      erros.push(`DDD ${ddd} não é um código nacional válido`)
    }
  }
  
  // Verificar quantidade de dígitos
  if (limpo.length < 8 || limpo.length > 13) {
    erros.push('Quantidade de dígitos fora do padrão')
  }
  
  return {
    valido: erros.length === 0,
    erros
  }
}

module.exports = {
  DDDS_BRASIL,
  CODIGOS_NAO_GEOGRAFICOS,
  CODIGOS_PAISES,
  normalizarTelefone,
  extrairDDD,
  classificarTipoNumero,
  verificarRepeticao,
  validarEstrutura
}