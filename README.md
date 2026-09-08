# Héstia — Alerta Cidadão (Sistema Full Stack de Prevenção a Golpes)

> **Projeto Acadêmico (Projeto Integrador):** aplicação Full Stack para triagem de golpes financeiros e digitais — analisa links, mensagens, chaves Pix, telefones e e-mails suspeitos, orienta vítimas e divulga os golpes da semana.

---

## 📋 Sobre o Projeto

O **Héstia (Alerta Cidadão)** ajuda o cidadão a se proteger contra golpes de **Engenharia Social** (Pix, phishing, clonagem e deepfake). O usuário cola um link, mensagem, chave Pix, número de telefone ou e-mail suspeito e o sistema realiza uma análise **heurística** em menos de 3 segundos, exibindo um **Semáforo de Risco** (verde/amarelo/vermelho) com os motivos encontrados.

O projeto também oferece um **passo a passo pós-golpe** (MED, B.O., troca de senhas) e uma **Central de Alertas** com os golpes mais comuns da semana por região.

A aplicação segue boas práticas de arquitetura de software, segurança HTTP com Helmet, sanitização de entradas, **privacidade/LGPD** (nada do que é analisado é gravado), **acessibilidade cognitiva** (fontes grandes, alto contraste e comandos por voz) e é instalável como **PWA**.

> 📄 O plano de migração completo consta em [`doc/plano_hestia_alerta_cidadao.md`](doc/plano_hestia_alerta_cidadao.md).

---

## 📊 Status do Projeto (Setembro 2026)

| Componente | Status | Observação |
|------------|--------|------------|
| Backend (API REST) | ✅ Funcional | Express 5, SQLite, Helmet, CORS |
| Motor Heurístico | ✅ Funcional | 5 tipos: link, texto, Pix, telefone, email |
| Frontend (PWA) | ✅ Funcional | SPA com 4 abas, Service Worker |
| Acessibilidade | ✅ Funcional | Voz, alto contraste, fontes escaláveis, ARIA |
| Testes Unitários | ✅ Criados | 4 suites (analisador, validadores, telefone, email) |
| Documentação UML | ✅ Gerada | Requisitos de Usuário, Requisitos de Sistema, Escopo do Projeto |
| CI/CD | ⏳ Pendente | GitHub Actions não configurado |
| Lint/Formatador | ⏳ Pendente | ESLint + Prettier não configurados |
| Deploy | ⏳ Pendente | Aplicação roda apenas localmente |

### Pendências

- **CI/CD:** Configurar GitHub Actions com workflows para install, lint, test, build.
- **Lint/Formatador:** Instalar ESLint + Prettier no `api/`.
- **Testes E2E:** Criar testes ponta a ponta com Playwright ou Cypress.
- **Deploy:** Configurar deploy em Vercel (frontend), Railway/Render (backend).
- **Rate Limiting:** Instalar `express-rate-limit` (60 req/min por IP).
- **Logs Estruturados:** Integrar Winston ou Pino.

---

## 🛠️ Tecnologias Utilizadas

### **Backend (API RESTful)**
- **Node.js** — Ambiente de execução JavaScript no servidor (v18 LTS).
- **Express.js** (v5) — Framework web para rotas e middlewares.
- **better-sqlite3** — Driver síncrono e de alta performance para o banco SQLite.
- **Helmet** — Cabeçalhos de segurança HTTP.
- **CORS** — Habilitação de Cross-Origin Resource Sharing.
- **Validator** — Sanitização e validação de entradas.
- **Dotenv** — Gerenciamento de variáveis de ambiente.
- **Chai** — Biblioteca de asserções para testes unitários.

### **Frontend (Interface do Usuário)**
- **HTML5 Semântico** — Marcação acessível e estruturada (ARIA).
- **Tailwind CSS** — Framework CSS utilitário responsivo.
- **JavaScript ES6+ (Módulos ES)** — Navegação por abas (SPA-like via Fetch API), semáforo de risco e Web Speech API.
- **PWA** — `manifest.webmanifest` + Service Worker para instalação.

### **Documentação Técnica (UML 2.5.1)**
- **PlantUML** — Diagramas de Casos de Uso, Sequência, Componentes e Implantação.
- **Padrões:** OMG UML 2.5.1, ISO/IEC/IEEE 29148:2018, FURPS+ / ISO/IEC 25010.

---

## 📁 Estrutura do Projeto

```text
rantigolpes/
├── api/                          # Servidor Backend em Node.js
│   ├── db/                       # Banco de dados SQLite (criado em runtime)
│   ├── src/
│   │   ├── config/
│   │   │   ├── conexaoBanco.js   # Conexão do SQLite (WAL + FK)
│   │   │   ├── listaGolpes.js    # Seeds de alertas e guia pós-golpe
│   │   │   ├── codigosNacionais.js # Database DDD brasileiros
│   │   │   └── dominiosEmail.js  # Database domínios + typosquatting
│   │   ├── controladores/
│   │   │   ├── analiseControlador.js # Triagem heurística
│   │   │   ├── alertaControlador.js  # Central de alertas
│   │   │   └── guiaControlador.js    # Passo a passo pós-golpe
│   │   ├── rotas/
│   │   │   ├── analiseRotas.js
│   │   │   ├── alertaRotas.js
│   │   │   └── guiaRotas.js
│   │   ├── utilitarios/
│   │   │   ├── analisadorGolpes.js   # Motor heurístico de risco (5 tipos)
│   │   │   └── validadores.js        # Sanitização e validação dos inputs
│   │   ├── app.js                # Configuração do Express e Middlewares
│   │   └── server.js             # Inicialização da porta e servidor
│   ├── testes/                   # Testes unitários (Chai)
│   │   ├── analisadorGolpes.test.js
│   │   ├── validadores.test.js
│   │   ├── telefone.test.js
│   │   └── email.test.js
│   ├── .env                      # Variáveis de ambiente (PORT, ORIGEM_PERMITIDA)
│   ├── .env.example              # Modelo de variáveis de ambiente
│   ├── iniciarBanco.js           # DDL das tabelas + seeds
│   └── package.json              # Dependências e scripts do Node.js
│
├── frontend/                     # Interface Web (App Héstia)
│   ├── assets/
│   │   └── icone.svg             # Ícone do PWA
│   ├── css/
│   │   └── estilo.css            # Tema acessível + alto contraste
│   ├── js/
│   │   ├── app.js                # Navegação, acessibilidade, toast
│   │   ├── analise.js            # Semáforo de risco / análise
│   │   ├── alertas.js            # Central de alertas
│   │   ├── guia.js               # Passo a passo pós-golpe
│   │   └── voz.js                # Web Speech API (entrada e saída)
│   ├── manifest.webmanifest      # Manifest do PWA
│   ├── service-worker.js         # Cache offline (API nunca é cacheada)
│   └── index.html                # Estrutura visual do app
│
├── doc/                          # Documentação técnica do projeto
│   ├── requisitos_de_usuario.md  # Requisitos de Usuário (UML 2.5.1)
│   ├── requisitos_de_sistema.md  # Requisitos de Sistema (FURPS+)
│   ├── escopo_do_projeto.md      # Escopo do Projeto (PMBOK 7ª Ed.)
│   ├── ATUALIZACAO_projeto_Hestia_telefone_email.md
│   ├── plano_hestia_alerta_cidadao.md
│   ├── PROGRESSO_atualizado.md
│   ├── prompt.md
│   └── projeto_integrador/       # Documentação acadêmica
│
├── .gitignore
└── README.md
```

---

## 🗄️ Modelagem do Banco de Dados (SQLite)

Banco inicializado automaticamente na subida da aplicação (`iniciarBanco.js`).

### **Tabela `alertas_golpes`** — Central de Alertas

```sql
CREATE TABLE IF NOT EXISTS alertas_golpes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo          TEXT NOT NULL,
    descricao       TEXT NOT NULL,
    regiao          TEXT NOT NULL,
    categoria       TEXT NOT NULL,
    nivel_risco     TEXT NOT NULL CHECK(nivel_risco IN ('verde','amarelo','vermelho')),
    data_publicacao TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_alertas_regiao ON alertas_golpes(regiao);
CREATE INDEX IF NOT EXISTS idx_alertas_categoria ON alertas_golpes(categoria);
```

### **Tabela `estatisticas_analise`** — Métricas Anônimas (LGPD)

Armazena **apenas metadados** (tipo de entrada, risco e regras atingidas) — nunca o conteúdo analisado:

```sql
CREATE TABLE IF NOT EXISTS estatisticas_analise (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_entrada     TEXT NOT NULL CHECK(tipo_entrada IN ('link','texto','pix','telefone','email')),
    risco            TEXT NOT NULL CHECK(risco IN ('verde','amarelo','vermelho')),
    regras_atingidas TEXT DEFAULT NULL,
    criado_em        TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_estatisticas_risco ON estatisticas_analise(risco);
```

---

## 🚀 Endpoints da API

| Método | Endpoint | Descrição | Payload |
|---|---|---|---|
| `GET` | `/` | App web (estático) | — |
| `GET` | `/api/health` | Health Check da API | — |
| `POST` | `/api/analises` | Triagem heurística (5 tipos) | JSON `{ tipo, conteudo }` |
| `GET` | `/api/alertas` | Alertas da semana por região/categoria | query `?regiao=&categoria=` |
| `POST` | `/api/alertas` | Cadastra novo alerta (administrativo) | JSON alerta |
| `GET` | `/api/guia` | Passo a passo pós-golpe | — |

### **Exemplo `POST /api/analises`**

**Body:**
```json
{
  "tipo": "texto",
  "conteudo": "URGENTE!!! Você ganhou um prêmio! Confirme seus dados e senha clicando no link."
}
```

**Resposta (HTTP 200):**
```json
{
  "sucesso": true,
  "risco": "vermelho",
  "regras_atingidas": "urgencia_ou_pedido,pedido_dados",
  "regras_detalhes": [
    { "nome": "urgencia_ou_pedido", "descricao": "Contém termos típicos de golpe: urgente, senha" }
  ],
  "resumo": "Possíveis sinais de golpe encontrados: ...",
  "tempo_ms": 1
}
```

**Erro de validação (HTTP 400):**
```json
{
  "sucesso": false,
  "erro": "Tipo de análise inválido. Use \"link\", \"texto\", \"pix\", \"telefone\" ou \"email\"."
}
```

---

## 🔍 Como Funciona a Análise de Risco

O motor heurístico (`analisadorGolpes.js`) avalia padrões conhecidos de golpe para **5 tipos de conteúdo**:

- **Links:** encurtadores (`bit.ly`, `t.ly`...), sem HTTPS, extensões incomuns (`.tk`, `.xyz`...), domínios com números e uso alterado de marcas de bancos/governos.
- **Textos:** urgência, prêmios, pedido de dados sensíveis (CPF/senha/token), pedidos de pagamento, CAIXA ALTA e exclamações excessivas.
- **Chaves Pix:** e-mail em domínio suspeito, CPF/telefone válidos (neutro) e instruções suspeitas acompanhando a chave.
- **Telefones:** normalização, validação DDD, classificação (móvel/fixo/internacional/não-geográfico), detecção de repetição e flags contextuais (urgência, pedidos de código, pagamento, prêmios, menções bancárias).
- **E-mails:** validação de sintaxe, classificação de domínio (gratuito/descartável/educacional/governamental/suspeito), detecção de typosquatting (distância de Levenshtein) e análise do local-part.

A pontuação determina o nível: **0–1 verde**, **2–3 amarelo**, **4+ vermelho**.

---

## 🛡️ Privacidade e LGPD

- **Nenhum conteúdo analisado é persistido** (link, texto ou chave Pix). A análise é efêmera.
- Apenas métricas anônimas (tipo, risco, regras) são gravadas em `estatisticas_analise`.
- O Service Worker **não intercepta** requisições à API.

---

## ♿ Acessibilidade Cognitiva (RNF1)

- Fontes grandes com botões **A− / A+** (escala chega a 125%).
- **Alto contraste** (tema preto/branco com amarelo de destaque).
- **Voz**: falar em vez de digitar (SpeechRecognition) e leitura dos resultados em voz alta (speechSynthesis).
- HTML semântico, `aria-live`, foco visível, navegação por teclado e `prefers-reduced-motion`.

---

## 🔧 Como Executar o Projeto (VS Code — Windows & Linux Ubuntu)

### Pré-requisitos
- **Node.js** (v18 LTS ou superior) e **npm** instalados.
- **Git** instalado.

> 🐧 **Linux (Ubuntu/Debian):**
> ```bash
> sudo apt update && sudo apt install -y nodejs npm git
> ```

### Instalar dependências
```bash
cd api
npm install
```

### Criar arquivo de variáveis de ambiente
```bash
cp .env.example .env
```

### Iniciar servidor
```bash
npm run dev
```

### Executar testes
```bash
npm test
```

### Acessar
- **App Héstia:** http://localhost:3000/
- **Health Check:** http://localhost:3000/api/health

### Parar o servidor
- `Ctrl + C` no terminal.
- Porta ocupada — Linux: `sudo fuser -k 3000/tcp` • Windows: `npx kill-port 3000`

---

## 🛡️ Segurança e Boas Práticas

- **Prepared Statements** via `better-sqlite3` (anti SQL Injection).
- **Sanitização de entradas** com `validator` (anti XSS).
- **Helmet + CORS + payload limit (10kb)**.
- **Respostas padronizadas** com códigos HTTP semânticos (200, 201, 400, 401, 500).
- **Sem persistência de conteúdo sensível** (LGPD).
- **JWT** para autenticação administrativa (tokens stateless com expiração de 24h).
- **bcrypt** para criptografia de senhas (salt rounds ≥ 10).

---

## 🧪 Testes Unitários

Testes unitários com **Chai** (expect style) na pasta `api/testes/`:

| Arquivo | Linhas | Cobertura |
|---------|--------|-----------|
| `analisadorGolpes.test.js` | 113 | Motor heurístico: dispatch, regras de link/texto/Pix |
| `validadores.test.js` | 115 | Sanitização, validação de análise e alertas |
| `telefone.test.js` | 123 | Normalização, DDD, classificação, repetição, flags contextuais |
| `email.test.js` | 144 | Sintaxe, domínio, typosquatting, local-part, flags contextuais |

### Executar testes:
```bash
cd api
npm test
```

---

## 📚 Documentação Técnica (UML 2.5.1)

Documentação completa gerada conforme padrões **OMG UML 2.5.1**, **ISO/IEC/IEEE 29148:2018** e **FURPS+ / ISO/IEC 25010**:

| Arquivo | Conteúdo |
|---------|----------|
| [`doc/requisitos_de_usuario.md`](doc/requisitos_de_usuario.md) | 16 Requisitos de Usuário, 10 Histórias de Usuário (BDD/Gherkin), Diagramas de Casos de Uso e Sequência (PlantUML) |
| [`doc/requisitos_de_sistema.md`](doc/requisitos_de_sistema.md) | 8 Requisitos Funcionais, 18 Requisitos Não Funcionais (FURPS+), Diagramas de Backend, Classes OCL, DDL Completo, Contratos API RESTful |
| [`doc/escopo_do_projeto.md`](doc/escopo_do_projeto.md) | Objetivos SMART, Diagrama de Contexto, Componentes UML, Deployment, EAP/WBS, Matrizes de Governança |

---

## 📜 Licença e Créditos

Projeto desenvolvido para fins educacionais e acadêmicos
(**Integrantes:** Arthur Augusto Matchulevicz; Carlos Eduardo Freitas Côimbra Paixão; Lucas Zoccal Corona; Nicollas Stails Ramos Nogueira — Professor: André Lobo).
Sinta-se à vontade para utilizar como base para seus próprios aprendizados.