const CACHE = 'hestia-pwa-v2'
const DESENVOLVIMENTO = ['localhost', '127.0.0.1'].includes(self.location.hostname)
const PAGES = self.location.hostname.endsWith('.github.io')

const RECURSOS = [
  './',
  './index.html',
  './api-config.js',
  './manifest.webmanifest',
  './css/estilo.css',
  './js/app.js',
  './js/config.js',
  './js/analise.js',
  './js/analisadorLocal.js',
  './js/alertas.js',
  './js/guia.js',
  './js/voz.js',
  './js/i18n.js',
  './js/analytics.js',
  './js/admin.js',
  './api/alertas.json',
  './api/guia.json',
  './assets/icone.svg',
  './assets/icone-192.png',
  './assets/icone-512.png',
  './assets/icone-maskable-192.png',
  './assets/icone-maskable-512.png',
  './assets/bandeira-brasil.svg',
  './assets/bandeira-eua.svg',
  './assets/bandeira-espanha.svg'
]

const MENSAGEM_OFFLINE = {
  'pt-BR': 'Sem conexão: a verificação em tempo real exige internet. Use o Guia de prevenção salvo no aplicativo e tente novamente quando estiver online.',
  en: 'Offline: real-time fraud checking needs an internet connection. Use the prevention guide saved in the app and try again when online.',
  es: 'Sin conexión: la verificación en tiempo real requiere internet. Usa la guía de prevención guardada en la app e inténtalo de nuevo cuando estés en línea.'
}

const GUIA_OFFLINE = {
  'pt-BR': [
    { titulo: 'Mantenha a calma e determine o que aconteceu', descricao: 'Se recebeu uma mensagem suspeita, não forneça dados nem clique em links. Se abriu um link, não insira informações e use outro dispositivo confiável para verificar sua conta.' },
    { titulo: 'Proteja contas e dados imediatamente', descricao: 'Se informou uma senha, altere-a por dispositivo confiável e ative a verificação em duas etapas. Se recebeu malware ou teve a conta comprometida, bloqueie cartões e sessões pelos canais oficiais.' },
    { titulo: 'Conteste Pix pela instituição financeira', descricao: 'Para fraude ou indevido uso de Pix, procure o banco pelos canais oficiais e solicite análise do MED. A elegibilidade depende dos critérios aplicáveis e não garante devolução.' },
    { titulo: 'Troque senhas e revise acessos', descricao: 'Comece pelo e-mail vinculado ao banco, depois redes sociais e serviços financeiros. Revogue sessões desconhecidas e confirme alterações pelos canais oficiais.' },
    { titulo: 'Registre um Boletim de Ocorrência', descricao: 'Faça o B.O. pela Delegacia Eletrônica da sua região ou presencialmente. Leve todos os comprovantes e detalhes da conversa.' },
    { titulo: 'Denuncie a página, o número e o canal', descricao: 'Reporte o perfil, o número de WhatsApp ou a página usada no golpe para a plataforma. Isso ajuda a proteger outras pessoas.' }
  ],
  en: [
    { titulo: 'Stay calm and work out what happened', descricao: 'If you received a suspicious message, do not share data or click links. If you opened a link, do not enter information and use another trusted device to check your account.' },
    { titulo: 'Protect accounts and data immediately', descricao: 'If you shared a password, change it from a trusted device and enable two-factor authentication. If your device or account was compromised, block cards and sessions through official channels.' },
    { titulo: 'Request a Pix chargeback from your bank', descricao: 'For Pix fraud, contact your bank through official channels and ask about MED. Eligibility depends on the applicable rules and a refund is not guaranteed.' },
    { titulo: 'Change passwords and review access', descricao: 'Start with the email linked to your bank, then social networks and financial services. Revoke unknown sessions and confirm changes through official channels.' },
    { titulo: 'File a police report', descricao: 'File a report online or in person at your local police station. Bring all receipts and details of the conversation.' },
    { titulo: 'Report the page, number and channel', descricao: 'Report the profile, phone number or page used in the scam to the platform. This helps protect other people.' }
  ],
  es: [
    { titulo: 'Mantén la calma y determina qué ocurrió', descricao: 'Si recibiste un mensaje sospechoso, no compartas datos ni hagas clic en enlaces. Si abriste un enlace, no introduzcas información y usa otro dispositivo de confianza para revisar tu cuenta.' },
    { titulo: 'Protege cuentas y datos de inmediato', descricao: 'Si compartiste una contraseña, cámbiala desde un dispositivo de confianza y activa la verificación en dos pasos. Si hubo malware o tu cuenta fue comprometida, bloquea tarjetas y sesiones por canales oficiales.' },
    { titulo: 'Solicita la devolución de un Pix al banco', descricao: 'En caso de fraude con Pix, contacta al banco por canales oficiales y consulta sobre el MED. La elegibilidad depende de las normas aplicables y no garantiza la devolución.' },
    { titulo: 'Cambia contraseñas y revisa accesos', descricao: 'Empieza por el correo vinculado al banco, luego redes sociales y servicios financieros. Revoca sesiones desconocidas y confirma cambios por canales oficiales.' },
    { titulo: 'Presenta una denuncia policial', descricao: 'Presenta la denuncia en línea o de forma presencial. Lleva todos los comprobantes y detalles de la conversación.' },
    { titulo: 'Denuncia la página, el número y el canal', descricao: 'Reporta el perfil, el número o la página usada en la estafa a la plataforma. Eso ayuda a proteger a otras personas.' }
  ]
}

const HTML_OFFLINE = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Héstia — sem conexão</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:40rem;margin:auto;color:#0f172a"><h1>Héstia sem conexão</h1><p>Não foi possível carregar o aplicativo. Verifique sua internet e tente novamente.</p></body></html>'

function json(dados, status = 200) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  })
}

function idiomaDaRequisicao(requisicao) {
  const valor = (requisicao.headers.get('Accept-Language') || 'pt-BR').toLowerCase()
  if (valor.startsWith('en')) return 'en'
  if (valor.startsWith('es')) return 'es'
  return 'pt-BR'
}

async function respostaApi(requisicao, url) {
  try {
    return await fetch(requisicao)
  } catch {
    const idioma = idiomaDaRequisicao(requisicao)
    if (url.pathname.endsWith('/api/guia')) {
      return json({ sucesso: true, dados: GUIA_OFFLINE[idioma], offline: true })
    }
    return json({ sucesso: false, offline: true, mensagem: MENSAGEM_OFFLINE[idioma] }, 503)
  }
}

async function htmlRedePrimeiro(requisicao) {
  try {
    const resposta = await fetch(requisicao)
    if (resposta && resposta.ok) {
      const cache = await caches.open(CACHE)
      await cache.put(requisicao, resposta.clone())
    }
    return resposta
  } catch {
    return (await caches.match(requisicao)) ||
      (await caches.match('./index.html')) ||
      new Response(HTML_OFFLINE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
}

async function estatico(requisicao) {
  const cache = await caches.open(CACHE)
  const emCache = await cache.match(requisicao)
  const rede = fetch(requisicao)
    .then(async (resposta) => {
      if (resposta && resposta.ok && !DESENVOLVIMENTO) {
        await cache.put(requisicao, resposta.clone())
      }
      return resposta
    })
    .catch(() => null)

  if (DESENVOLVIMENTO) return (await rede) || emCache || Response.error()
  if (emCache) {
    rede.catch(() => {})
    return emCache
  }
  return (await rede) || Response.error()
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(RECURSOS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(
        chaves.filter((chave) => chave.startsWith('hestia-') && chave !== CACHE)
          .map((chave) => caches.delete(chave))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request
  if (requisicao.method !== 'GET') return

  const url = new URL(requisicao.url)
  if (url.origin !== self.location.origin) return

  if (!PAGES && url.pathname.includes('/api/')) {
    evento.respondWith(respostaApi(requisicao, url))
    return
  }

  if (requisicao.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    evento.respondWith(htmlRedePrimeiro(requisicao))
    return
  }

  evento.respondWith(estatico(requisicao))
})
