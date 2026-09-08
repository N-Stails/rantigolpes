const { expect } = require('chai')
const { analisar, avaliarTelefone } = require('../src/utilitarios/analisadorGolpes')

describe('Análise de Telefone', () => {
  describe('Normalização e validação', () => {
    it('deve aceitar formato brasileiro padrão', () => {
      const resultado = avaliarTelefone('(11) 99876-5432')
      expect(resultado.regras).to.be.an('array')
      expect(resultado.informacoes.ddd).to.equal('11')
    })

    it('deve aceitar formato sem formatação', () => {
      const resultado = avaliarTelefone('11998765432')
      expect(resultado.regras).to.be.an('array')
      expect(resultado.informacoes.ddd).to.equal('11')
    })

    it('deve aceitar formato com código de país', () => {
      const resultado = avaliarTelefone('+55 11 99876-5432')
      expect(resultado.regras).to.be.an('array')
      expect(resultado.informacoes.ddd).to.equal('11')
    })

    it('deve identificar DDD válido', () => {
      const resultado = avaliarTelefone('11998765432')
      const dddRule = resultado.regras.find(r => r.nome === 'telefone_ddd_identificado')
      expect(dddRule).to.exist
      expect(dddRule.descricao).to.include('11')
    })

    it('deve classificar número móvel', () => {
      const resultado = avaliarTelefone('11998765432')
      expect(resultado.informacoes.tipo).to.equal('movel')
    })

    it('deve classificar número fixo', () => {
      const resultado = avaliarTelefone('1133334444')
      expect(resultado.informacoes.tipo).to.equal('fixo')
    })
  })

  describe('Códigos não geográficos', () => {
    it('deve identificar 0800', () => {
      const resultado = avaliarTelefone('08001234567')
      const regra = resultado.regras.find(r => r.nome === 'telefone_codigo_nao_geografico')
      expect(regra).to.exist
      expect(regra.descricao).to.include('gratuito')
    })

    it('deve identificar 0900', () => {
      const resultado = avaliarTelefone('09001234567')
      const regra = resultado.regras.find(r => r.nome === 'telefone_codigo_nao_geografico')
      expect(regra).to.exist
      expect(regra.descricao).to.include('premium')
    })
  })

  describe('Estrutura inválida', () => {
    it('deve detectar DDD inválido', () => {
      const resultado = avaliarTelefone('00998765432')
      const regra = resultado.regras.find(r => r.nome === 'telefone_ddd_invalido')
      expect(regra).to.exist
    })

    it('deve detectar quantidade inválida de dígitos', () => {
      const resultado = avaliarTelefone('12345')
      const regra = resultado.regras.find(r => r.nome === 'telefone_formato_invalido')
      expect(regra).to.exist
    })
  })

  describe('Repetição', () => {
    it('deve detectar números repetitivos', () => {
      const resultado = avaliarTelefone('11111111111')
      const regra = resultado.regras.find(r => r.nome === 'telefone_numero_repetitivo')
      expect(regra).to.exist
    })
  })

  describe('Contexto', () => {
    it('deve detectar urgência', () => {
      const resultado = avaliarTelefone('11998765432 URGENTE ligue agora')
      const regra = resultado.regras.find(r => r.nome === 'telefone_contexto_urgente')
      expect(regra).to.exist
    })

    it('deve detectar pedido de código', () => {
      const resultado = avaliarTelefone('11998765432 envie o código de verificação')
      const regra = resultado.regras.find(r => r.nome === 'telefone_contexto_codigo_seguranca')
      expect(regra).to.exist
    })

    it('deve detectar pagamento', () => {
      const resultado = avaliarTelefone('11998765432 faça o pagamento via PIX')
      const regra = resultado.regras.find(r => r.nome === 'telefone_contexto_pagamento')
      expect(regra).to.exist
    })

    it('deve detectar prêmio', () => {
      const resultado = avaliarTelefone('11998765432 Parabéns você ganhou um prêmio')
      const regra = resultado.regras.find(r => r.nome === 'telefone_contexto_premio')
      expect(regra).to.exist
    })

    it('deve detectar menção a banco', () => {
      const resultado = avaliarTelefone('11998765432 Banco do Brasil ligando')
      const regra = resultado.regras.find(r => r.nome === 'telefone_contexto_banco')
      expect(regra).to.exist
    })
  })

  describe('Classificação de risco', () => {
    it('deve retornar verde para telefone normal', () => {
      const resultado = analisar('11998765432', 'telefone')
      expect(resultado.risco).to.equal('verde')
    })

    it('deve retornar amarelo ou vermelho para telefone com contexto suspeito', () => {
      const resultado = analisar('11998765432 URGENTE envie o código de verificação', 'telefone')
      expect(['amarelo', 'vermelho']).to.include(resultado.risco)
    })
  })
})