const alertasIniciais = [
  {
    titulo: 'Falso investimento em criptomoedas',
    descricao: 'Golpistas prometem rendimentos altos e garantidos com criptomoedas, exigindo depósitos via Pix. Nenhum investimento legítimo garante lucro fixo.',
    regiao: 'Brasil',
    categoria: 'investimento',
    nivel_risco: 'vermelho'
  },
  {
    titulo: 'Falsa central de atendimento bancário',
    descricao: 'Ligações se passando pelo banco pedem confirmação de dados ou instalação de aplicativos. O banco nunca pede senha ou token por telefone.',
    regiao: 'Brasil',
    categoria: 'phishing',
    nivel_risco: 'vermelho'
  },
  {
    titulo: 'Falso emprego home-office',
    descricao: 'Vagas com salários muito altos e cobranças de taxa para "garantir" a contratação. Empregos legítimos não cobram nada do candidato.',
    regiao: 'Brasil',
    categoria: 'emprego',
    nivel_risco: 'vermelho'
  },
  {
    titulo: 'Pix bloqueado por "erro de cadastro"',
    descricao: 'Mensagens dizem que seu Pix foi bloqueado e pedem "atualização de dados" por link. O banco não atualiza dados por link enviado por SMS ou WhatsApp.',
    regiao: 'Brasil',
    categoria: 'pix',
    nivel_risco: 'amarelo'
  },
  {
    titulo: 'Prêmio ou sorteio falso no WhatsApp',
    descricao: 'Mensagens afirmam que você ganhou um prêmio e solicitam dados pessoais ou pagamento de taxa para liberar o valor. Desconfie de prêmios não solicitados.',
    regiao: 'Brasil',
    categoria: 'sorteio',
    nivel_risco: 'amarelo'
  },
  {
    titulo: 'Golpe do "falso sequestro" com voz clonada',
    descricao: 'Uso de IA para clonar a voz de familiares pedindo dinheiro de emergência. Combine uma palavra-código com a família para confirmar chamadas.',
    regiao: 'Brasil',
    categoria: 'engenharia-social',
    nivel_risco: 'vermelho'
  },
  {
    titulo: 'Falsas promoções de lojas clonadas',
    descricao: 'Anúncios patrocinados em redes sociais levam a lojas falsas com preços imbatíveis. Confira o domínio e o CNPJ antes de pagar.',
    regiao: 'Centro-Oeste',
    categoria: 'clonagem',
    nivel_risco: 'amarelo'
  },
  {
    titulo: 'Golpe da falsa vaga no INSS',
    descricao: 'Supostos atendentes do INSS pedem dados ou depósitos para "desbloquear" aposentadoria. O INSS não liga pedindo Pix nem senha.',
    regiao: 'Centro-Oeste',
    categoria: 'phishing',
    nivel_risco: 'vermelho'
  }
]

const guiaPosGolpe = [
  {
    titulo: 'Mantenha a calma e determine o que aconteceu',
    descricao: 'Se recebeu uma mensagem suspeita, não forneça dados nem clique em links. Se abriu um link, não insira informações e use outro dispositivo confiável para verificar sua conta.'
  },
  {
    titulo: 'Proteja contas e dados imediatamente',
    descricao: 'Se informou uma senha, altere-a por dispositivo confiável e ative a verificação em duas etapas. Se recebeu malware ou teve a conta comprometida, bloqueie cartões e sessões pelos canais oficiais.'
  },
  {
    titulo: 'Conteste Pix pela instituição financeira',
    descricao: 'Para fraude ou indevido uso de Pix, procure o banco pelos canais oficiais e solicite análise do MED. O MED é exclusivo do Pix, a elegibilidade depende dos critérios aplicáveis e a solicitação em casos elegíveis pode ser feita em até 80 dias após a ocorrência; não garante devolução.'
  },
  {
    titulo: 'Troque senhas e revise acessos',
    descricao: 'Comece pelo e-mail vinculado ao banco, depois redes sociais e serviços financeiros. Revogue sessões desconhecidas e confirme alterações pelos canais oficiais.'
  },
  {
    titulo: 'Registre um Boletim de Ocorrência',
    descricao: 'Faça o B.O. pela Delegacia Eletrônica da sua região ou presencialmente. Leve todos os comprovantes e detalhes da conversa.'
  },
  {
    titulo: 'Denuncie a página, o número e o canal',
    descricao: 'Reporte o perfil, o número de WhatsApp ou a página usada no golpe para a plataforma. Isso ajuda a proteger outras pessoas.'
  }
]

module.exports = { alertasIniciais, guiaPosGolpe }