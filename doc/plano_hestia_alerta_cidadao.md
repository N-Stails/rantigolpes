# Plano de Migração — Projeto Héstia (Alerta Cidadão)

> Documento gerado a partir da análise de `doc/projeto_integrador/*` e da arquitetura descrita no `README.md`.
> Status: **aguardando aprovação** — a codificação só será iniciada após confirmação.

---

## 1. Contexto e Objetivo

O repositório atualmente contém uma **Landing Page de Captura de Leads** (Node.js + Express + SQLite) para um negócio genérico. A documentação acadêmica do **Projeto Integrador** define um novo produto: **Héstia (Alerta Cidadão)** — uma aplicação de **prevenção a golpes** que analisa links, textos e chaves Pix suspeitas, exibe um diagnóstico de risco (semáforo verde/amarelo/vermelho), orienta vítimas de golpe (passo a passo pós-ocorrência) e divulga os golpes mais comuns da semana por região.

**Objetivo do plano:** transformar o projeto atual em um aplicativo web (mobile-first, instalável como PWA) para o Héstia, **mantendo integralmente a arquitetura de software** descrita no `README.md` e atualizando a stack tecnológica para versões atuais.

---

## 2. Análise da Documentação (doc/projeto_integrador)

### 2.1. Problema e Solução — Prevenção de Golpes
- ~56 mi de brasileiros já sofreram golpe financeiro/virtual; 90% dos ataques usam Engenharia Social.
- Solução nº 3 (adotada): extensão/assistente que avalia links e mensagens e exibe **risco em cores intuitivas** (verde/amarelo/vermelho).
- Solução nº 4 (adotada): **guia automatizado pós-golpe** (acionar banco, gerar B.O.) com relatórios padronizados.

### 2.2. Mapa de Empatia
Três personas definem os requisitos de UX:
1. **Consumidor digital comum** (3k–10k/mês): medo de ser enganado, quer autonomia digital.
2. **Idoso 65–80 anos**: dificuldade visual/cognitiva, precisa de **fontes grandes, alto contraste, voz e acolhimento sem julgamento**.
3. **Jovem 16–24 anos**: vulnerável a golpes de "renda fácil", precisa de senso crítico.

### 2.3. Requisitos Funcionais e Não Funcionais — Héstia
| Código | Requisito | Tipo |
|---|---|---|
| RF1 | **Análise de Texto/Links**: colar links, chaves Pix ou textos suspeitos para análise | Funcional |
| RF2 | **Diagnóstico Visual**: nível de risco gráfico (Semáforo de Risco) | Funcional |
| RF3 | **Passo a Passo Pós-Golpe**: guia automatizado (acionar banco, gerar B.O.) | Funcional |
| RF4 | **Central de Alertas**: golpes mais comuns da semana por região | Funcional |
| RNF1 | **Acessibilidade Cognitiva**: fontes grandes, alto contraste, comandos por voz | Não funcional |
| RNF2 | **Desempenho**: resposta da triagem ≤ 3 segundos | Não funcional |
| RNF3 | **Privacidade**: não armazenar dados sensíveis colados nas análises (LGPD) | Não funcional |

### 2.4. Histórias de Usuário — Cooperativa (exemplo)
Documento usado como **modelo de formato** (é um exemplo de outro projeto). Será seguido o *formato* ("Como [persona] eu quero [ação] para [benefício]") para redigir as histórias do Héstia, mas **não** o conteúdo de cooperativa.

---

## 3. Escopo da Mudança

| Área | Situação atual | Situação alvo (Héstia) |
|---|---|---|
| Propósito | Landing de leads genérica | App de prevenção a golpes |
| Frontend | 1 página (hero, benefícios, formulário) | Interface mobile-first com 4 funcionalidades + acessibilidade |
| Banco | Tabela `leads` | Tabelas `alertas_golpes` e `estatisticas_analise` |
| API | `/api/leads`, `/api/health` | `/api/analises`, `/api/alertas`, `/api/guia`, `/api/health` |
| Privacidade | Armazena dados pessoais | Análises efêmeras (nada de conteúdo sensível persistido) |

---

## 4. Arquitetura de Software (mantida conforme README.md)

Mantém-se o mesmo desenho de camadas e organização de pastas do `README.md`:

```text
api/
├── db/                          # SQLite (runtime)
├── src/
│   ├── config/
│   │   ├── conexaoBanco.js      # Conexão + WAL + FK (mantido)
│   │   └── listaGolpes.js       # [NOVO] Base local de golpes conhecidos (padrões e alertas da semana)
│   ├── controladores/
│   │   ├── analiseControlador.js    # [NOVO] Triagem (RF1/RF2)
│   │   ├── alertaControlador.js     # [NOVO] Central de alertas (RF4)
│   │   └── guiaControlador.js       # [NOVO] Passo a passo pós-golpe (RF3)
│   ├── rotas/
│   │   ├── analiseRotas.js      # [NOVO]
│   │   ├── alertaRotas.js       # [NOVO]
│   │   └── guiaRotas.js         # [NOVO]
│   ├── utilitarios/
│   │   ├── analisadorGolpes.js  # [NOVO] Motor heurístico de risco (núcleo do app)
│   │   └── validadores.js       # [REFATORADO] Validações das novas entradas
│   ├── app.js                   # Middlewares + registro de rotas (mantido)
│   └── server.js                # Bootstrap (mantido)
├── .env                         # PORT, ORIGEM_PERMITIDA
├── iniciarBanco.js              # [REFATORADO] DDL das novas tabelas
└── package.json                 # [ATUALIZADO] Dependências atuais
```

Regras de arquitetura preservadas:
- **MVC**: rotas → controladores → utilitários/config → banco.
- **Camada de validação/sanitização** isolada em `utilitarios/validadores.js`.
- **Prepared statements** via `better-sqlite3` (anti SQL Injection).
- **Helmet + CORS + limite de payload (10kb)** mantidos.
- **Frontend SPA-like** com Fetch API, servido pelo Express.

---

## 5. Banco de Dados (SQLite)

Removida a tabela `leads` (fora do escopo do Héstia). Novas tabelas:

### `alertas_golpes` — Central de Alertas (RF4)
```sql
CREATE TABLE IF NOT EXISTS alertas_golpes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo          TEXT NOT NULL,
    descricao       TEXT NOT NULL,
    regiao          TEXT NOT NULL,               -- ex.: 'Brasil', 'MT', 'Cuiabá'
    categoria       TEXT NOT NULL,               -- ex.: 'pix', 'phishing', 'emprego', 'investimento'
    nivel_risco     TEXT NOT NULL CHECK(nivel_risco IN ('verde','amarelo','vermelho')),
    data_publicacao TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_alertas_regiao ON alertas_golpes(regiao);
CREATE INDEX IF NOT EXISTS idx_alertas_categoria ON alertas_golpes(categoria);
```

### `estatisticas_analise` — métricas anônimas (LGPD / RF3-NF)
Armazena **apenas metadados** (nunca o conteúdo colado pelo usuário):
```sql
CREATE TABLE IF NOT EXISTS estatisticas_analise (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_entrada TEXT NOT NULL CHECK(tipo_entrada IN ('link','texto','pix')),
    risco       TEXT NOT NULL CHECK(risco IN ('verde','amarelo','vermelho')),
    regras_atingidas TEXT,                        -- ex.: 'urgencia,shortener' (sem conteúdo)
    criado_em   TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_estatisticas_risco ON estatisticas_analise(risco);
```

> **Privacidade (RNF3):** nenhum link, texto, chave Pix ou dado pessoal colado na análise é gravado. A análise é 100% efêmera.

---

## 6. Backend — API REST

### 6.1. Novas rotas

| Método | Endpoint | Descrição | Payload |
|---|---|---|---|
| `POST` | `/api/analises` | Triagem heurística de link/texto/chave Pix | `{ tipo, conteudo }` |
| `GET` | `/api/alertas` | Golpes da semana por região (filtro opcional) | query: `?regiao=` / `?categoria=` |
| `POST` | `/api/alertas` | Cadastro de novo alerta (uso administrativo) | JSON alerta |
| `GET` | `/api/guia` | Passo a passo pós-golpe (RF3) | — |
| `GET` | `/api/health` | Health check (mantido) | — |

**Resposta `POST /api/analises` (201, alvo ≤ 3s):**
```json
{
  "sucesso": true,
  "risco": "vermelho",
  "cor": "#dc2626",
  "classificacao": "Alto risco",
  "regras_atingidas": ["urgencia", "encurtador_de_link", "pedido_de_dados"],
  "resumo": "Possíveis sinais de golpe: linguagem de urgência e link encurtado."
}
```

### 6.2. Motor Heurístico — `utilitarios/analisadorGolpes.js`
Análise por padrões (determinística, rápida, sem chamadas externas → atende RNF2):

**Links:**
- Domínio/prefixo de shortener (`bit.ly`, `tinyurl`, `t.ly`, `is.gd`, etc.) → risco alto.
- `http://` sem HTTPS → suspeito.
- Números em domínio + "promoção", subdomínios mascarados (`-br.tk`, `paypal-seguro.com`).
- Domínio conhecido de banco/governo com variação (typosquatting: `banco-brasil.com`, `gov-br.com`).

**Textos:**
- Palavras-gatilho: *URGENTE*, *prêmio*, *você ganhou*, *confirme seus dados*, *atualize seu cadastro*, *Pix liberado*, *renda extra*, *investimento garantido*.
- Pedidos de dados pessoais (CPF, senha, token, cartão).
- Excesso de pontuação/CAIXA ALTA e número de telefone estranho.

**Chaves Pix:**
- Chave do tipo e-mail em domínio suspeito; chave aleatória com texto prometendo "prêmio"; presença de instruções fora do padrão.

Saída: `{ risco: 'verde'|'amarelo'|'vermelho', regras_atingidas: [...], resumo }`.
Sem armazenamento do conteúdo (RNF3). Registro anônimo em `estatisticas_analise`.

### 6.3. Validações — `utilitarios/validadores.js` (refatorado)
- `validarAnalise(body)`: `tipo` ∈ {`link`, `texto`, `pix`}; `conteudo` obrigatório, tamanho máximo (ex.: 1000 chars), sanitização com `validator` (trim/escape apenas na resposta de erro; o conteúdo nunca é persistido).
- `validarAlerta(body)`: campos obrigatórios + `nivel_risco` válido.
- Mantém padrões de resposta HTTP semânticos: 200, 201, 400, 422, 500.

### 6.4. Segurança (mantida/fortalecida)
- Helmet (CSP ajustada para permitir Web Speech API), CORS restrito via `.env`, limite de payload `10kb`, prepared statements.

---

## 7. Frontend — Interface Web (mobile-first / PWA)

### 7.1. Estrutura (mantida do README)
```text
frontend/
├── index.html          # App Héstia (tela única, navegação por abas)
├── css/estilo.css      # Tema acessível (alto contraste, fontes grandes)
├── js/
│   ├── app.js          # Lógica principal + navegação + Fetch API
│   ├── analise.js      # [NOVO] Formulário de análise + semáforo
│   ├── alertas.js      # [NOVO] Central de alertas (RF4)
│   ├── guia.js         # [NOVO] Passo a passo pós-golpe (RF3)
│   └── voz.js          # [NOVO] Web Speech API (RNF1)
└── manifest.webmanifest  # [NOVO] PWA instalável
```

### 7.2. Seções da interface
1. **Análise (RF1/RF2)** — campo de texto para colar link/texto/chave Pix + botão de voz (microfone); após análise exibe o **Semáforo de Risco** (círculo verde/amarelo/vermelho grande + rótulo + lista de motivos). Resultado lido em voz alta (RNF1).
2. **Central de Alertas (RF4)** — cards dos golpes da semana, filtro por região/categoria, ícones grandes.
3. **Pós-Golpe (RF3)** — fluxo guiado: "Você foi vítima?" → passos para acionar o banco (MED), gerar B.O., trocar senhas; checklist interativo com leitura em voz.
4. **Sobre/Empatia** — linguagem simples, tom acolhedor e sem julgamento (personas dos mapas de empatia).

### 7.3. Acessibilidade Cognitiva (RNF1)
- **Fontes grandes** (base ≥ 18px, opção de aumentar).
- **Alto contraste** (tema AA/AAA, cores fortes além de texto: ícone + rótulo no semáforo).
- **Voz**: entrada por `SpeechRecognition` (Web Speech API) e saída por `speechSynthesis`.
- HTML semântico, `aria-live` para resultados, foco visível, navegação por teclado.
- Sem depender só de cor: semáforo com símbolos/emoji + texto.

---

## 8. Tecnologias e Versões (linguagens atualizadas)

| Camada | Atual | Alvo (atualizado) |
|---|---|---|
| Runtime | Node 18+ | Node.js **LTS atual (22.x)** |
| Framework API | Express 4 | Express **5.x** (ou 4.x mais recente, se incompatibilidade) |
| Banco | better-sqlite3 9.x | better-sqlite3 **11.x+** |
| Segurança | Helmet 8, cors, validator 13 | versões **mais recentes** (dotenv 17, etc.) |
| Frontend | Tailwind CDN + vanilla JS ES6+ | Tailwind (atual) + **ES6+/ES Modules** + Web Speech API + manifest PWA |
| Padrão | CommonJS | mantém CommonJS (consistente com arquitetura atual) |

> Mudanças de versão serão feitas com instalação limpa e testes de bootstrap (`npm start` + health check).

---

## 9. Fases de Implementação (ordem de execução)

| Fase | Entrega | Tarefas |
|---|---|---|
| **1. Banco** | DDL migrado | `iniciarBanco.js` com `alertas_golpes` e `estatisticas_analise`; remover `leads`; seeds de alertas iniciais |
| **2. Núcleo de análise** | Motor heurístico | `analisadorGolpes.js` + testes manuais de casos (link, texto, pix) |
| **3. API** | Endpoints prontos | controladores + rotas (`/analises`, `/alertas`, `/guia`) + validadores |
| **4. Frontend básico** | Tela de análise | `index.html` + `analise.js` + semáforo + toast |
| **5. Alertas + Guia** | Funcionalidades RF3/RF4 | `alertas.js`, `guia.js`, renderização dinâmica |
| **6. Acessibilidade** | RNF1 completo | `voz.js`, alto contraste, fontes grandes, aria |
| **7. PWA + ajustes** | Instalável | manifest, meta tags, revisão de desempenho (< 3s) |
| **8. Limpeza** | Repo organizado | remover código de leads, atualizar README, `.env.example` |

---

## 10. Critérios de Aceite / Validação

- [ ] `POST /api/analises` retorna risco correto para casos-teste (link encurtado → vermelho; texto normal → verde; texto com "URGENTE + prêmio" → amarelo/vermelho).
- [ ] **Tempo de resposta da triagem ≤ 3 segundos** (RNF2), medido no navegador.
- [ ] Central de alertas lista golpes filtrados por região (RF4).
- [ ] Guia pós-golpe entrega os passos de contingência (RF3).
- [ ] Nenhum conteúdo analisado é persistido no banco (RNF3) — verificação por inspeção da tabela.
- [ ] Interface acessível: leitura em voz dos resultados, alto contraste, navegação por teclado (RNF1).
- [ ] `npm run dev` sobe servidor e serve o app sem erros; health check OK.
- [ ] Lint/estrutura de pastas segue o README (config/controladores/rotas/utilitarios).

---

## 11. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Express 5 incompatível com padrões atuais | Validar no bootstrap da Fase 3; se necessário, permanecer na última 4.x |
| Web Speech API não suportada em todos os navegadores | Feature-detection com fallback (digitação) e aviso amigável |
| Falso positivo/negativo na heurística | Regras conservadoras, resumo explicando o motivo, grau "amarelo" para incerteza |
| Acúmulo de dados em `estatisticas_analise` | Retenção anônima e sem conteúdo; opcional rotina de limpeza |
| Requisito "aplicativo móvel" x arquitetura web | Entrega como web app mobile-first + PWA instalável (sem deviar da arquitetura do README) |

---

## 12. Histórias de Usuário (formato seguindo o exemplo docx)

- **EU (Idosa):** como *dona de casa aposentada*, quero *colar a mensagem suspeita recebida no WhatsApp e ouvir o resultado em voz alta*, para *saber se é golpe sem precisar ler telas complicadas*.
- **EU (Jovem):** como *estudante em busca de renda extra*, quero *saber se a oferta de emprego/investimento é golpe*, para *não ter meus dados roubados*.
- **EU (Consumidor comum):** como *usuário bancário*, quero *ver os golpes da semana na minha região*, para *me proteger com antecedência*.
- **EU (Vítima):** como *pessoa que caiu em um golpe*, quero *um passo a passo de contingência*, para *acionar o banco (MED) e gerar o B.O. rapidamente*.

---

## 13. O que será removido/descartado

- Tabela `leads` e endpoints `/api/leads` (cadastrar/listar).
- Conteúdo genérico da landing (hero de negócio, formulário de contato, "MinhaMarca").
- Documento de exemplo de cooperativa (mantido apenas na pasta original, sem código).

---

**Próximo passo:** aguardando sua aprovação para iniciar a **Fase 1 (Banco de Dados)** e sequência das demais fases.
