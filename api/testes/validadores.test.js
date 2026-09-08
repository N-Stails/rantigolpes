const { expect } = require('chai')
const { sanitizar, validarAnalise, validarAlerta } = require('../src/utilitarios/validadores')

describe('Validadores', () => {
  describe('sanitizar', () => {
    it('deve remover espaços extras', () => {
      expect(sanitizar('  texto  ')).to.equal('texto')
    })

    it('deve escapar caracteres especiais', () => {
      expect(sanitizar('<script>alert("xss")</script>')).to.not.include('<')
    })

    it('deve tratar entrada vazia', () => {
      expect(sanitizar('')).to.equal('')
      expect(sanitizar(null)).to.equal('')
      expect(sanitizar(undefined)).to.equal('')
    })
  })

  describe('validarAnalise', () => {
    it('deve aceitar link válido', () => {
      const resultado = validarAnalise({ tipo: 'link', conteudo: 'https://example.com' })
      expect(resultado.valido).to.be.true
      expect(resultado.dados.tipo).to.equal('link')
    })

    it('deve aceitar texto válido', () => {
      const resultado = validarAnalise({ tipo: 'texto', conteudo: 'Mensagem normal' })
      expect(resultado.valido).to.be.true
      expect(resultado.dados.tipo).to.equal('texto')
    })

    it('deve aceitar pix válido', () => {
      const resultado = validarAnalise({ tipo: 'pix', conteudo: 'chave-pix' })
      expect(resultado.valido).to.be.true
      expect(resultado.dados.tipo).to.equal('pix')
    })

    it('deve aceitar telefone válido', () => {
      const resultado = validarAnalise({ tipo: 'telefone', conteudo: '11998765432' })
      expect(resultado.valido).to.be.true
      expect(resultado.dados.tipo).to.equal('telefone')
    })

    it('deve aceitar email válido', () => {
      const resultado = validarAnalise({ tipo: 'email', conteudo: 'usuario@example.com' })
      expect(resultado.valido).to.be.true
      expect(resultado.dados.tipo).to.equal('email')
    })

    it('deve rejeitar tipo inválido', () => {
      const resultado = validarAnalise({ tipo: 'invalido', conteudo: 'conteudo' })
      expect(resultado.valido).to.be.false
      expect(resultado.erros).to.include.members(['Tipo de análise inválido. Use "link", "texto", "pix", "telefone" ou "email".'])
    })

    it('deve rejeitar conteúdo muito curto', () => {
      const resultado = validarAnalise({ tipo: 'link', conteudo: 'ab' })
      expect(resultado.valido).to.be.false
    })

    it('deve rejeitar conteúdo muito longo', () => {
      const resultado = validarAnalise({ tipo: 'link', conteudo: 'a'.repeat(2001) })
      expect(resultado.valido).to.be.false
    })

    it('deve rejeitar telefone com poucos dígitos', () => {
      const resultado = validarAnalise({ tipo: 'telefone', conteudo: '1234567' })
      expect(resultado.valido).to.be.false
      expect(resultado.erros).to.include('Telefone deve conter pelo menos 8 dígitos.')
    })

    it('deve rejeitar email sem @', () => {
      const resultado = validarAnalise({ tipo: 'email', conteudo: 'usuarioexample.com' })
      expect(resultado.valido).to.be.false
      expect(resultado.erros).to.include('E-mail deve conter o caractere "@".')
    })
  })

  describe('validarAlerta', () => {
    it('deve aceitar alerta válido', () => {
      const resultado = validarAlerta({
        titulo: 'Golpe do PIX falso',
        descricao: 'Mensagem falsa do banco',
        regiao: 'Sudeste',
        categoria: 'Golpe PIX',
        nivel_risco: 'vermelho'
      })
      expect(resultado.valido).to.be.true
    })

    it('deve rejeitar título muito curto', () => {
      const resultado = validarAlerta({
        titulo: 'Curto',
        descricao: 'Descrição do alerta',
        regiao: 'Sudeste',
        categoria: 'Golpe',
        nivel_risco: 'vermelho'
      })
      expect(resultado.valido).to.be.false
    })

    it('deve rejeitar nível de risco inválido', () => {
      const resultado = validarAlerta({
        titulo: 'Título do alerta',
        descricao: 'Descrição do alerta',
        regiao: 'Sudeste',
        categoria: 'Golpe',
        nivel_risco: 'invalido'
      })
      expect(resultado.valido).to.be.false
    })
  })
})