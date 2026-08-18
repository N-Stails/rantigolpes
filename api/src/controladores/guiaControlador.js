const { guiaPosGolpe } = require('../config/listaGolpes')

// Passo a passo pós-golpe (RF3): guia de contingência (MED, B.O., senhas)
function obterGuia(_req, res) {
  res.json({ sucesso: true, dados: guiaPosGolpe })
}

module.exports = { obterGuia }