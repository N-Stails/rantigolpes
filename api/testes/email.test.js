const { expect } = require('chai')
const { analisar, avaliarEmail } = require('../src/utilitarios/analisadorGolpes')

describe('Análise de E-mail', () => {
  describe('Sintaxe', () => {
    it('deve aceitar e-mail válido', () => {
      const resultado = avaliarEmail('usuario@example.com')
      expect(resultado.regras).to.be.an('array')
      expect(resultado.informacoes.dominio).to.equal('example.com')
    })

    it('deve rejeitar e-mail sem @', () => {
      const resultado = avaliarEmail('usuarioexample.com')
      const regra = resultado.regras.find(r => r.nome === 'email_sintaxe_invalida')
      expect(regra).to.exist
    })

    it('deve rejeitar e-mail sem domínio', () => {
      const resultado = avaliarEmail('usuario@')
      const regra = resultado.regras.find(r => r.nome === 'email_sintaxe_invalida')
      expect(regra).to.exist
    })
  })

  describe('Domínio', () => {
    it('deve classificar provedor gratuito', () => {
      const resultado = avaliarEmail('usuario@gmail.com')
      const regra = resultado.regras.find(r => r.nome === 'email_provedor_gratuito')
      expect(regra).to.exist
      expect(resultado.informacoes.categoria_dominio).to.equal('gratuito')
    })

    it('deve identificar domínio descartável', () => {
      const resultado = avaliarEmail('usuario@tempmail.com')
      const regra = resultado.regras.find(r => r.nome === 'email_dominio_descartavel')
      expect(regra).to.exist
    })

    it('deve identificar domínio suspeito (TLD)', () => {
      const resultado = avaliarEmail('usuario@dominio.xyz')
      const regra = resultado.regras.find(r => r.nome === 'email_dominio_suspeito')
      expect(regra).to.exist
    })
  })

  describe('Typosquatting/Impersonação', () => {
    it('deve detectartyposquatting de banco', () => {
      const resultado = avaliarEmail('banco-brasil@banco-brasil.com')
      const regra = resultado.regras.find(r => r.nome === 'email_possivel_typosquatting')
      expect(regra).to.exist
      expect(regra.descricao).to.include('Banco do Brasil')
    })

    it('deve detectar typosquatting de Microsoft', () => {
      const resultado = avaliarEmail('micr0soft@microsoft-seguro.com')
      const regra = resultado.regras.find(r => r.nome === 'email_possivel_typosquatting')
      expect(regra).to.exist
      expect(regra.descricao).to.include('Microsoft')
    })

    it('deve detectar typosquatting de WhatsApp', () => {
      const resultado = avaliarEmail('whats-app@whatsapp-seguro.com')
      const regra = resultado.regras.find(r => r.nome === 'email_possivel_typosquatting')
      expect(regra).to.exist
      expect(regra.descricao).to.include('WhatsApp')
    })
  })

  describe('Local-part', () => {
    it('deve detectar local-part excessivamente longo', () => {
      const email = 'a'.repeat(35) + '@example.com'
      const resultado = avaliarEmail(email)
      const regra = resultado.regras.find(r => r.nome === 'email_local_part_longo')
      expect(regra).to.exist
    })

    it('deve detectar local-part com muitos números', () => {
      const resultado = avaliarEmail('1234567890@example.com')
      const regra = resultado.regras.find(r => r.nome === 'email_local_part_numeroso')
      expect(regra).to.exist
    })

    it('deve detectar local-part repetitivo', () => {
      const resultado = avaliarEmail('abcabcabc@example.com')
      const regra = resultado.regras.find(r => r.nome === 'email_local_part_repetitivo')
      expect(regra).to.exist
    })

    it('deve detectar termos suspeitos no local-part', () => {
      const resultado = avaliarEmail('premio@example.com')
      const regra = resultado.regras.find(r => r.nome === 'email_local_part_suspeito')
      expect(regra).to.exist
    })
  })

  describe('Contexto', () => {
    it('deve detectar urgência', () => {
      const resultado = avaliarEmail('usuario@example.com URGENTE verifique sua conta')
      const regra = resultado.regras.find(r => r.nome === 'email_contexto_urgente')
      expect(regra).to.exist
    })

    it('deve detectar pedido de código', () => {
      const resultado = avaliarEmail('usuario@example.com envie o código de verificação')
      const regra = resultado.regras.find(r => r.nome === 'email_contexto_codigo_seguranca')
      expect(regra).to.exist
    })

    it('deve detectar pagamento', () => {
      const resultado = avaliarEmail('usuario@example.com faça o pagamento via PIX')
      const regra = resultado.regras.find(r => r.nome === 'email_contexto_pagamento')
      expect(regra).to.exist
    })

    it('deve detectar prêmio', () => {
      const resultado = avaliarEmail('usuario@example.com Parabéns você ganhou um prêmio')
      const regra = resultado.regras.find(r => r.nome === 'email_contexto_premio')
      expect(regra).to.exist
    })

    it('deve detectar menção a banco', () => {
      const resultado = avaliarEmail('usuario@example.com Banco do Brasil')
      const regra = resultado.regras.find(r => r.nome === 'email_contexto_banco')
      expect(regra).to.exist
    })
  })

  describe('Classificação de risco', () => {
    it('deve retornar verde para e-mail normal', () => {
      const resultado = analisar('usuario@example.com', 'email')
      expect(resultado.risco).to.equal('verde')
    })

    it('deve retornar amarelo ou vermelho para e-mail com typosquatting', () => {
      const resultado = analisar('banco-brasil@banco-brasil.com', 'email')
      expect(['amarelo', 'vermelho']).to.include(resultado.risco)
    })

    it('deve retornar amarelo ou vermelho para e-mail descartável', () => {
      const resultado = analisar('usuario@tempmail.com', 'email')
      expect(['amarelo', 'vermelho']).to.include(resultado.risco)
    })
  })
})