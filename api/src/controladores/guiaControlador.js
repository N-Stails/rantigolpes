const { guiaPosGolpe } = require('../config/listaGolpes')

// Passo a passo pós-golpe (RF3): guia de contingência (MED, B.O., senhas)
function obterGuia(_req, res) {
  const idioma = (_req.headers['accept-language'] || '').split(',')[0].toLowerCase()
  if (idioma.startsWith('en')) {
    const en = [
      ['Stay calm and identify what happened', 'If you received a suspicious message, do not provide data or click links. If you opened a link, do not enter information and check your account from another trusted device.'],
      ['Protect accounts and data immediately', 'If you disclosed a password, change it from a trusted device and enable two-factor authentication. If your account was compromised, block cards and sessions through official channels.'],
      ['Contact your financial institution about the Pix', 'For possible fraud or unauthorized use of Pix, contact your bank through official channels and request assessment of the Special Refund Mechanism (MED). MED is Pix-only, eligibility depends on applicable criteria, eligible requests may be made within 80 days after the event, and a request does not guarantee recovery.'],
      ['Change passwords and review access', 'Start with the email linked to the bank, then social media and financial services. Revoke unknown sessions and verify changes through official channels.'],
      ['File a police report', 'Keep evidence and file a report through the electronic police station in your region or in person.'],
      ['Report the page, number and channel', 'Report the profile, WhatsApp number or page used by the scammer to the platform and official consumer channels.']
    ]
    return res.json({ sucesso: true, dados: guiaPosGolpe.map((passo, i) => ({ titulo: en[i][0], descricao: en[i][1] })) })
  }
  if (idioma.startsWith('es')) {
    const es = [
      ['Mantenga la calma y determine qué ocurrió', 'Si recibió un mensaje sospechoso, no facilite datos ni haga clic en enlaces. Si abrió un enlace, no introduzca información y revise su cuenta desde otro dispositivo confiable.'],
      ['Proteja cuentas y datos de inmediato', 'Si reveló una contraseña, cámbiela desde un dispositivo confiable y active la autenticación en dos pasos. Si la cuenta fue comprometida, bloquee tarjetas y sesiones por canales oficiales.'],
      ['Contacte a la institución financiera por el Pix', 'En caso de fraude o uso indebido de Pix, contacte al banco por canales oficiales y solicite evaluación del Mecanismo Especial de Devolución (MED). El MED es exclusivo de Pix, la elegibilidad depende de criterios aplicables y en casos elegibles la solicitud puede hacerse hasta 80 días después; no garantiza devolución.'],
      ['Cambie contraseñas y revise accesos', 'Comience por el correo vinculado al banco y continúe con redes sociales y servicios financieros. Revise sesiones desconocidas y confirme cambios por canales oficiales.'],
      ['Registre una denuncia', 'Haga la denuncia por la delegación electrónica de su región o presencialmente. Lleve comprobantes y detalles.'],
      ['Denuncie la página, número y canal', 'Reporte el perfil, número de WhatsApp o página usada en la estafa a la plataforma.']
    ]
    return res.json({ sucesso: true, dados: guiaPosGolpe.map((passo, i) => ({ titulo: es[i][0], descricao: es[i][1] })) })
  }
  res.json({ sucesso: true, dados: guiaPosGolpe })
}

module.exports = { obterGuia }