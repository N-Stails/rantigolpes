# Héstia — Alerta Cidadão (Sistema Full Stack de Prevenção a Golpes)

> **Projeto Acadêmico (Projeto Integrador):** aplicação Full Stack para triagem de golpes financeiros e digitais — analisa links, mensagens e chaves Pix suspeitas, orienta vítimas e divulga os golpes da semana.

---

## 📋 Sobre o Projeto

O **Héstia (Alerta Cidadão)** ajuda o cidadão a se proteger contra golpes de **Engenharia Social** (Pix, phishing, clonagem e deepfake). O usuário cola um link, texto ou chave Pix suspeita e o sistema realiza uma análise **heurística** em menos de 3 segundos, exibindo um **Semáforo de Risco** (verde/amarelo/vermelho) com os motivos encontrados.

O projeto também oferece um **passo a passo pós-golpe** (MED, B.O., troca de senhas) e uma **Central de Alertas** com os golpes mais comuns da semana por região.

A aplicação segue boas práticas de arquitetura de software, segurança HTTP com Helmet, sanitização de entradas, **privacidade/LGPD** (nada do que é analisado é gravado), **acessibilidade cognitiva** (fontes grandes, alto contraste e comandos por voz) e é instalável como **PWA**.

> 📄 O plano de migração completo consta em [`doc/plano_hestia_alerta_cidadao.md`](doc/plano_hestia_alerta_cidadao.md).

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

### **Frontend (Interface do Usuário)**
- **HTML5 Semântico** — Marcação acessível e estruturada (ARIA).
- **Tailwind CSS** — Framework CSS utilitário responsivo.
- **JavaScript ES6+ (Módulos ES)** — Navegação por abas (SPA-like via Fetch API), semáforo de risco e Web Speech API.
- **PWA** — `manifest.webmanifest` + Service Worker para instalação.

---

## 📁 Estrutura do Projeto

```text
rantigolpes/
├── api/                          # Servidor Backend em Node.js
│   ├── db/                       # Banco de dados SQLite (criado em runtime)
│   ├── src/
│   │   ├── config/
│   │   │   ├── conexaoBanco.js   # Conexão do SQLite (WAL + FK)
│   │   │   └── listaGolpes.js    # Seeds de alertas e guia pós-golpe
│   │   ├── controladores/
│   │   │   ├── analiseControlador.js # Triagem heurística (RF1/RF2)
│   │   │   ├── alertaControlador.js  # Central de alertas (RF4)
│   │   │   └── guiaControlador.js    # Passo a passo pós-golpe (RF3)
│   │   ├── rotas/
│   │   │   ├── analiseRotas.js
│   │   │   ├── alertaRotas.js
│   │   │   └── guiaRotas.js
│   │   ├── utilitarios/
│   │   │   ├── analisadorGolpes.js   # Motor heurístico de risco
│   │   │   └── validadores.js        # Sanitização e validação dos inputs
│   │   ├── app.js                # Configuração do Express e Middlewares
│   │   └── server.js             # Inicialização da porta e servidor
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
│   ├── projeto_integrador/       # Documentação acadêmica (análise, requisitos)
│   └── plano_hestia_alerta_cidadao.md
│
├── .gitignore
└── README.md
```

---

## 🗄️ Modelagem do Banco de Dados (SQLite)

Banco inicializado automaticamente na subida da aplicação (`iniciarBanco.js`).

### **Tabela `alertas_golpes`** — Central de Alertas (RF4)

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

### **Tabela `estatisticas_analise`** — métricas anônimas (LGPD / RNF3)

Armazena **apenas metadados** (tipo de entrada, risco e regras atingidas) — nunca o conteúdo analisado:

```sql
CREATE TABLE IF NOT EXISTS estatisticas_analise (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_entrada     TEXT NOT NULL CHECK(tipo_entrada IN ('link','texto','pix')),
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
| `POST` | `/api/analises` | Triagem heurística (RF1/RF2) | JSON `{ tipo, conteudo }` |
| `GET` | `/api/alertas` | Alertas da semana por região/categoria | query `?regiao=&categoria=` |
| `POST` | `/api/alertas` | Cadastra novo alerta (administrativo) | JSON alerta |
| `GET` | `/api/guia` | Passo a passo pós-golpe (RF3) | — |

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
  "regras_atingidas": ["urgencia_ou_pedido", "pedido_dados"],
  "regras_detalhes": [
    { "nome": "urgencia_ou_pedido", "descricao": "Contém termos típicos de golpe: urgente, senha" }
  ],
  "resumo": "Possíveis sinais de golpe encontrados: ...",
  "tempo_ms": 1
}
```

**Erro de validação (HTTP 422):**
```json
{
  "sucesso": false,
  "mensagem": "Dados inválidos.",
  "erros": ["Tipo de análise inválido. Use \"link\", \"texto\" ou \"pix\"."]
}
```

---

## 🔍 Como Funciona a Análise de Risco

O motor heurístico (`analisadorGolpes.js`) avalia padrões conhecidos de golpe:

- **Links:** encurtadores (`bit.ly`, `t.ly`...), sem HTTPS, extensões incomuns (`.tk`, `.xyz`...), domínios com números e uso alterado de marcas de bancos/governos.
- **Textos:** urgência, prêmios, pedido de dados sensíveis (CPF/senha/token), pedidos de pagamento, CAIXA ALTA e exclamações excessivas.
- **Chaves Pix:** e-mail em domínio suspeito, CPF/telefone válidos (neutro) e instruções suspeitas acompanhando a chave.

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

### Iniciar
```bash
cd api
npm install        # necessário na primeira execução
npm run dev
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
- **Respostas padronizadas** com códigos HTTP semânticos (200, 201, 400, 422, 500).
- **Sem persistência de conteúdo sensível** (LGPD).

---

## 📜 Licença e Créditos

Projeto desenvolvido para fins educacionais e acadêmicos
(**Integrantes:** Arthur Augusto Matchulevicz; Carlos Eduardo Freitas Côimbra Paixão; Lucas Zoccal Corona; Nicollas Stails Ramos Nogueira — Professor: André Lobo).
Sinta-se à vontade para utilizar como base para seus próprios aprendizados.