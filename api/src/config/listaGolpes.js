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
    titulo: 'Mantenha a calma e reúna os registros',
    descricao: 'Guarde comprovantes, prints, contatos e números usados no golpe. Eles são essenciais para o banco e a polícia.'
  },
  {
    titulo: 'Bloqueie seus cartões e contas',
    descricao: 'Entre no aplicativo do seu banco ou ligue para a central oficial (número no verso do cartão) e bloqueie imediatamente cartões e acessos.'
  },
  {
    titulo: 'Acione o MED (Mecanismo Especial de Devolução)',
    descricao: 'Abrir o MED no seu banco aumenta as chances de reaver o valor do Pix. Faça isso o quanto antes após a ocorrência.'
  },
  {
    titulo: 'Troque todas as suas senhas',
    descricao: 'Altere senhas de e-mail, banco e redes sociais, sempre de outro dispositivo. Ative a verificação em duas etapas.'
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