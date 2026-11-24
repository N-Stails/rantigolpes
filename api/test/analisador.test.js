const test = require('node:test')
const assert = require('node:assert/strict')
const { analisar } = require('../src/utilitarios/analisadorGolpes')
const { validarAnalise, validarAlerta } = require('../src/utilitarios/validadores')

test('analisa texto suspeito com risco vermelho', () => {
  const resultado = analisar('URGENTE! Confirme sua senha e token agora.', 'texto')
  assert.equal(resultado.risco, 'vermelho')
  assert.ok(resultado.regras_atingidas.includes('pedido_dados'))
})

test('aceita link sem sinais como risco verde', () => {
  const resultado = analisar('https://www.gov.br', 'link')
  assert.notEqual(resultado.classificacao, 'risco_identificado')
})

test('valida conteúdo mínimo e tamanho máximo', () => {
  const curto = validarAnalise({ tipo: 'texto', conteudo: 'oi' })
  assert.equal(curto.valido, false)

  const longo = validarAnalise({ tipo: 'texto', conteudo: 'x'.repeat(2001) })
  assert.equal(longo.valido, false)
})

test('valida alerta administrativo e URL de fonte opcional', () => {
  const valido = validarAlerta({
    titulo: 'Alerta válido',
    descricao: 'Descrição válida para o teste.',
    regiao: 'Brasil',
    categoria: 'pix',
    nivel_risco: 'amarelo',
    fonte_url: 'https://www.gov.br'
  })
  assert.equal(valido.valido, true)

  const invalido = validarAlerta({
    titulo: 'Alerta válido',
    descricao: 'Descrição válida para o teste.',
    regiao: 'Brasil',
    categoria: 'pix',
    nivel_risco: 'amarelo',
    fonte_url: 'javascript:alert(1)'
  })
  assert.equal(invalido.valido, false)
})

test('chave Pix CPF válida isolada não representa risco por si só', () => {
  const resultado = analisar('12345678909', 'pix')
  assert.equal(resultado.classificacao, 'inconclusivo')
  assert.ok(resultado.itens_nao_suspeitos.some((item) => item.nome === 'pix_cpf'))
  assert.equal(resultado.regras_detalhes.length, 0)
})

test('urgência isolada não estabelece fraude', () => {
  const resultado = analisar('Preciso entregar este documento com urgência até hoje.', 'texto')
  assert.equal(resultado.classificacao, 'atencao_necessaria')
})

test('mensagem legítima com termos isolados permanece verde', () => {
  const resultado = analisar('Parabéns pelo novo emprego! Confirme a data da entrevista.', 'texto')
  assert.equal(resultado.classificacao, 'inconclusivo')
})

test('combinação de urgência e pedido de senha eleva o risco', () => {
  const resultado = analisar('URGENTE: informe sua senha e token agora pelo link.', 'texto')
  assert.equal(resultado.risco, 'vermelho')
})

test('ambiguidade sem combinação decisiva fica com confiança baixa', () => {
  const resultado = analisar('Promoção disponível para interessados.', 'texto')
  assert.notEqual(resultado.classificacao, 'risco_identificado')
  assert.equal(resultado.confianca.nivel, 'baixa')
})

test('urgente me pague exige atenção em vez de parecer seguro', () => {
  const resultado = analisar('Urgente, me pague', 'texto')
  assert.equal(resultado.classificacao, 'atencao_necessaria')
  assert.equal(resultado.risco, 'amarelo')
})

test('mensagem solicitando código de autenticação recebe risco identificado', () => {
  const resultado = analisar('Não compartilhe o código SMS nem o token recebido.', 'texto')
  assert.equal(resultado.classificacao, 'risco_identificado')
  assert.ok(resultado.regras_atingidas.includes('codigo_autenticacao'))
})

test('ameaça de bloqueio combinada com urgência exige atenção ou risco', () => {
  const resultado = analisar('Sua conta será bloqueada hoje. Urgente: confirme agora.', 'texto')
  assert.notEqual(resultado.classificacao, 'inconclusivo')
  assert.notEqual(resultado.risco, 'verde')
})

test('conteúdo incompleto é inconclusivo', () => {
  const resultado = analisar('', 'texto')
  assert.equal(resultado.classificacao, 'inconclusivo')
  assert.equal(resultado.risco, 'cinza')
})

test('chave Pix com formato inválido não acusa pessoa', () => {
  const resultado = analisar('chave-sem-formato', 'pix')
  assert.equal(resultado.classificacao, 'inconclusivo')
  assert.equal(resultado.risco, 'cinza')
})

test('URL inválida não é tratada como domínio confiável', () => {
  const resultado = analisar('http://', 'link')
  assert.equal(resultado.classificacao, 'inconclusivo')
})

test('resultado de IA só aceita estados conhecidos', () => {
  const { extrairJson } = require('../src/utilitarios/analisadorIA')
  const parsed = extrairJson('```json\n{"classificacao":"atencao_necessaria","indicadores":[],"informacoes_neutras":[],"confianca":{"nivel":"baixa","justificativa":"Contexto insuficiente"}}\n```')
  assert.equal(parsed.classificacao, 'atencao_necessaria')
})
