const { expect } = require('chai')
const { analisar, avaliarLink, avaliarTexto, avaliarPix } = require('../src/utilitarios/analisadorGolpes')

describe('Analisador de Golpes - Geral', () => {
  describe('Função analisar', () => {
    it('deve processar tipo link', () => {
      const resultado = analisar('https://example.com', 'link')
      expect(resultado).to.have.property('risco')
      expect(resultado).to.have.property('regras_atingidas')
      expect(resultado).to.have.property('resumo')
    })

    it('deve processar tipo texto', () => {
      const resultado = analisar('Mensagem normal', 'texto')
      expect(resultado).to.have.property('risco')
      expect(resultado).to.have.property('regras_atingidas')
      expect(resultado).to.have.property('resumo')
    })

    it('deve processar tipo pix', () => {
      const resultado = analisar('chave-pix-aleatoria', 'pix')
      expect(resultado).to.have.property('risco')
      expect(resultado).to.have.property('regras_atingidas')
      expect(resultado).to.have.property('resumo')
    })

    it('deve processar tipo telefone', () => {
      const resultado = analisar('11998765432', 'telefone')
      expect(resultado).to.have.property('risco')
      expect(resultado).to.have.property('regras_atingidas')
      expect(resultado).to.have.property('resumo')
      expect(resultado).to.have.property('informacoes')
    })

    it('deve processar tipo email', () => {
      const resultado = analisar('usuario@example.com', 'email')
      expect(resultado).to.have.property('risco')
      expect(resultado).to.have.property('regras_atingidas')
      expect(resultado).to.have.property('resumo')
      expect(resultado).to.have.property('informacoes')
    })

    it('deve retornar verde para conteúdo seguro', () => {
      const resultado = analisar('https://www.google.com', 'link')
      expect(resultado.risco).to.equal('verde')
    })

    it('deve retornar risco para conteúdo suspeito', () => {
      const resultado = analisar('https://banco-brasil.com', 'link')
      expect(['amarelo', 'vermelho']).to.include(resultado.risco)
    })
  })

  describe('Regras de link', () => {
    it('deve detectar encurtador', () => {
      const resultado = avaliarLink('https://bit.ly/abc123')
      const regra = resultado.regras.find(r => r.nome === 'encurtador')
      expect(regra).to.exist
    })

    it('deve detectar HTTP sem HTTPS', () => {
      const resultado = avaliarLink('http://example.com')
      const regra = resultado.regras.find(r => r.nome === 'sem_https')
      expect(regra).to.exist
    })

    it('deve detectar TLD suspeito', () => {
      const resultado = avaliarLink('https://example.xyz')
      const regra = resultado.regras.find(r => r.nome === 'tld_suspeito')
      expect(regra).to.exist
    })
  })

  describe('Regras de texto', () => {
    it('deve detectar urgência', () => {
      const resultado = avaliarTexto('URGENTE! Você ganhou um prêmio')
      const regra = resultado.regras.find(r => r.nome === 'urgencia_ou_pedido')
      expect(regra).to.exist
    })

    it('deve detectar pedido de dados', () => {
      const resultado = avaliarTexto('Envie sua senha')
      const regra = resultado.regras.find(r => r.nome === 'pedido_dados')
      expect(regra).to.exist
    })

    it('deve detectar caixa alta', () => {
      const resultado = avaliarTexto('MENSAGEM EM MAIÚSCULAS PARA CHAMAR ATENÇÃO')
      const regra = resultado.regras.find(r => r.nome === 'caixa_alta')
      expect(regra).to.exist
    })
  })

  describe('Regras de Pix', () => {
    it('deve detectar chave Pix por e-mail suspeito', () => {
      const resultado = avaliarPix('usuario@tempmail.com')
      const regra = resultado.regras.find(r => r.nome === 'pix_email_suspeito')
      expect(regra).to.exist
    })

    it('deve detectar chave Pix aleatória', () => {
      const resultado = avaliarPix('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
      const regra = resultado.regras.find(r => r.nome === 'pix_aleatoria')
      expect(regra).to.exist
    })

    it('deve detectar instruções suspeitas', () => {
      const resultado = avaliarPix('chave-pix URGENTE envie agora')
      const regra = resultado.regras.find(r => r.nome === 'instrucoes_suspeitas')
      expect(regra).to.exist
    })
  })
})