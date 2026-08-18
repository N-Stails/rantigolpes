// Héstia — Service Worker simples (PWA)
// Estratégia: cache-first para estáticos, network-only para a API (privacidade dos dados)
const CACHE = 'hestia-v1'
const ESTATICOS = ['./', './index.html', './css/estilo.css', './js/app.js',
  './js/analise.js', './js/alertas.js', './js/guia.js', './js/voz.js',
  './manifest.webmanifest', './assets/icone.svg']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ESTATICOS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url)

  // Nunca intercepta a API (as análises são efêmeras — LGPD)
  if (url.pathname.startsWith('/api')) return

  evento.respondWith(
    caches.match(evento.request).then((doCache) => {
      const rede = fetch(evento.request)
        .then((resposta) => {
          if (resposta && resposta.ok && url.origin === self.location.origin) {
            const copia = resposta.clone()
            caches.open(CACHE).then((cache) => cache.put(evento.request, copia))
          }
          return resposta
        })
        .catch(() => caches.match('./index.html'))
      return doCache || rede
    })
  )
})