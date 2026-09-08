# Requisitos de Sistema — Hestia: Alerta Cidadão

**Versão:** 1.0  
**Data:** 08 de Setembro de 2026  
**Padrões de Referência:** OMG UML 2.5.1, ISO/IEC/IEEE 29148:2018, FURPS+ / ISO/IEC 25010  
**Escopo do Documento:** Especificações técnicas internas, contratos de integração, segurança e runtime Node.js

---

## Sumário

1. [Requisitos Funcionais de Sistema (RSF)](#1-requisitos-funcionais-de-sistema-rsf)
2. [Requisitos Não Funcionais (RSNF) — FURPS+ / ISO 25010](#2-requisitos-não-funcionais-rsnf--furps--iso-25010)
3. [Diagramas de Sequência de Backend](#3-diagramas-de-sequência-de-backend)
4. [Diagrama Estrutural de Classes de Domínio](#4-diagrama-estrutural-de-classes-de-domínio)
5. [Dicionário Técnico de Dados (DDL)](#5-dicionário-técnico-de-dados-ddl)
6. [Contratos de API RESTful](#6-contratos-de-api-restful)
7. [Matriz Bidirecional de Rastreabilidade Técnica](#7-matriz-bidirecional-de-rastreabilidade-técnica)

---

## 1. Requisitos Funcionais de Sistema (RSF)

### RSF-01: Rota de Análise Heurística

| Campo | Descrição |
|-------|-----------|
| **ID** | RSF-01 |
| **Endpoint** | `POST /api/analises` |
| **Controlador** | `analiseControlador.js` |
| **Descrição** | Recebe conteúdo suspeito do cliente, valida, sanitiza, processa via motor heurístico e retorna classificação de risco. |
| **Método HTTP** | `POST` |
| **Content-Type** | `application/json` |
| **Autenticação** | Não requer (rota pública) |
| **Payload da Requisição** | `{ "tipo": string, "conteudo": string }` |
| **Constraints do Payload** | `tipo` ∈ `["link", "texto", "pix", "telefone", "email"]` (obrigatório); `conteudo` — string com 3–2000 caracteres (obrigatório). |
| **Middlewares Aplicados** | `express.json({ limit: '10kb' })`, `helmet()`, `cors()`, `validarAnalise()` (validadores.js). |
| **Código de Status — Sucesso** | `200 OK` |
| **Resposta — Sucesso** | `{ "sucesso": true, "risco": string, "regras_atingidas": string, "regras_detalhes": object[], "resumo": string, "tempo_ms": number }` |
| **Código de Status — Validação** | `400 Bad Request` |
| **Resposta — Validação** | `{ "sucesso": false, "erro": string }` |
| **Código de Status — Erro Interno** | `500 Internal Server Error` |
| **Resposta — Erro Interno** | `{ "sucesso": false, "erro": "Erro interno do servidor" }` |
| **Efeito Colateral** | Insere registro anônimo em `estatisticas_analise` (tipo_entrada, risco, regras_atingidas). Conteúdo analisado NUNCA é persistido. |

---

### RSF-02: Rota de Listagem de Alertas (Pública)

| Campo | Descrição |
|-------|-----------|
| **ID** | RSF-02 |
| **Endpoint** | `GET /api/alertas` |
| **Controlador** | `alertaControlador.js` |
| **Descrição** | Retorna lista de alertas de golpes, com filtros opcionais por região e categoria. |
| **Método HTTP** | `GET` |
| **Autenticação** | Não requer (rota pública) |
| **Parâmetros de Query** | `?regiao={string}&categoria={string}` (opcionais) |
| **Middlewares Aplicados** | `helmet()`, `cors()` |
| **Query SQL** | `SELECT * FROM alertas_golpes WHERE regiao LIKE ? AND categoria LIKE ? ORDER BY data_publicacao DESC LIMIT 50` |
| **Código de Status — Sucesso** | `200 OK` |
| **Resposta — Sucesso** | `{ "sucesso": true, "dados": [{ "id": number, "titulo": string, "descricao": string, "regiao": string, "categoria": string, "nivel_risco": string, "data_publicacao": string }] }` |
| **Código de Status — Erro Interno** | `500 Internal Server Error` |
| **Resposta — Erro Interno** | `{ "sucesso": false, "erro": "Erro interno do servidor" }` |

---

### RSF-03: Rota de Cadastro de Alerta (Administrativa)

| Campo | Descrição |
|-------|-----------|
| **ID** | RSF-03 |
| **Endpoint** | `POST /api/alertas` |
| **Controlador** | `alertaControlador.js` |
| **Descrição** | Cadastra novo alerta de golpe no banco de dados (requer autenticação). |
| **Método HTTP** | `POST` |
| **Content-Type** | `application/json` |
| **Autenticação** | Requer `Authorization: Bearer <token>` (JWT válido) |
| **Payload da Requisição** | `{ "titulo": string, "descricao": string, "regiao": string, "categoria": string, "nivel_risco": string }` |
| **Constraints do Payload** | `titulo` — máx. 200 chars (obrigatório); `descricao` — máx. 2000 chars (obrigatório); `regiao` — máx. 100 chars (obrigatório); `categoria` — máx. 100 chars (obrigatório); `nivel_risco` ∈ `["verde", "amarelo", "vermelho"]` (obrigatório). |
| **Middlewares Aplicados** | `express.json({ limit: '10kb' })`, `helmet()`, `cors()`, `autenticarJWT()`, `validarAlerta()` (validadores.js). |
| **Query SQL** | `INSERT INTO alertas_golpes (titulo, descricao, regiao, categoria, nivel_risco) VALUES (?, ?, ?, ?, ?)` |
| **Código de Status — Sucesso** | `201 Created` |
| **Resposta — Sucesso** | `{ "sucesso": true, "mensagem": "Alerta cadastrado com sucesso" }` |
| **Código de Status — Não Autenticado** | `401 Unauthorized` |
| **Resposta — Não Autenticado** | `{ "sucesso": false, "erro": "Token inválido ou expirado" }` |
| **Código de Status — Validação** | `400 Bad Request` |
| **Resposta — Validação** | `{ "sucesso": false, "erro": string }` |

---

### RSF-04: Rota de Guia Pós-Golpe (Pública)

| Campo | Descrição |
|-------|-----------|
| **ID** | RSF-04 |
| **Endpoint** | `GET /api/guia` |
| **Controlador** | `guiaControlador.js` |
| **Descrição** | Retorna os dados estáticos do guia pós-golpe (6 etapas). |
| **Método HTTP** | `GET` |
| **Autenticação** | Não requer (rota pública) |
| **Middlewares Aplicados** | `helmet()`, `cors()` |
| **Fonte dos Dados** | `listaGolpes.js` → `guiaPosGolpe` (array estático em memória) |
| **Código de Status — Sucesso** | `200 OK` |
| **Resposta — Sucesso** | `{ "sucesso": true, "dados": [{ "id": number, "titulo": string, "descricao": string, "icone": string }] }` |
| **Código de Status — Erro Interno** | `500 Internal Server Error` |
| **Resposta — Erro Interno** | `{ "sucesso": false, "erro": "Erro interno do servidor" }` |

---

### RSF-05: Rota de Health Check

| Campo | Descrição |
|-------|-----------|
| **ID** | RSF-05 |
| **Endpoint** | `GET /api/health` |
| **Controlador** | Inline em `app.js` |
| **Descrição** | Verifica a disponibilidade do serviço e do banco de dados. |
| **Método HTTP** | `GET` |
| **Autenticação** | Não requer |
| **Middlewares Aplicados** | `helmet()`, `cors()` |
| **Código de Status — Sucesso** | `200 OK` |
| **Resposta — Sucesso** | `{ "sucesso": true, "mensagem": "Hestia API operacional", "timestamp": string }` |

---

### RSF-06: Serviço de Arquivos Estáticos (Frontend)

| Campo | Descrição |
|-------|-----------|
| **ID** | RSF-06 |
| **Endpoint** | `GET /` (e rotas estáticas) |
| **Controlador** | `express.static()` configurado em `app.js` |
| **Descrição** | Serve o frontend SPA (HTML, CSS, JS, ícone, manifest) a partir do diretório `../../frontend`. |
| **Método HTTP** | `GET` |
| **Autenticação** | Não requer |
| **Configuração** | `express.static(path.join(__dirname, '..', '..', 'frontend'))` |
| **SPA Fallback** | Todas as rotas que não começam com `/api` retornam `index.html`. |

---

### RSF-07: Middleware de Autenticação JWT

| Campo | Descrição |
|-------|-----------|
| **ID** | RSF-07 |
| **Componente** | `middleware/autenticarJWT.js` (implícito) |
| **Descrição** | Intercepta requisições em rotas protegidas, valida o token JWT do cabeçalho `Authorization: Bearer <token>`. |
| **Lógica** | 1. Extrai token do cabeçalho `Authorization`.<br>2. Verifica validade e expiração via `jwt.verify()`.<br>3. Decodifica payload e anexa a `req.usuario`.<br>4. Chama `next()` se válido; retorna 401 se inválido. |
| **Variável de Ambiente** | `JWT_SECRET` (chave HMAC usada para assinatura/verificação). |
| **Tempo de Expiração** | `24h` (configurado no `jwt.sign`). |

---

### RSF-08: Motor Heurístico de Análise

| Campo | Descrição |
|-------|-----------|
| **ID** | RSF-08 |
| **Componente** | `analisadorGolpes.js` |
| **Descrição** | Engine determinística que avalia conteúdo contra regras heurísticas e retorna classificação de risco. |
| **Funções** | `avaliarLink(url)`, `avaliarTexto(texto)`, `avaliarPix(conteudo)`, `avaliarTelefone(telefone)`, `avaliarEmail(email)`, `analisar(conteudo, tipo)` |
| **Regras de Link** | Detecção de URL shorteners (13 serviços), TLDs suspeitos (16 tipos), ausência de HTTPS, domínios numéricos, impersonação de marcas. |
| **Regras de Texto** | Palavras de alto risco (19 termos), palavras de médio risco (12 termos), CAIXA ALTA, exclamações excessivas, pedidos de dados pessoais, pedidos de pagamento, URLs embutidas. |
| **Regras de Pix** | Validação de formato de chave (email/CPF/telefone/UUID), instruções suspeitas de pagamento. |
| **Regras de Telefone** | Normalização, validação DDD, classificação (móvel/fixo/internacional/não-geográfico), detecção de repetição, flags contextuais (urgência, pedidos de código, pagamento, prêmios, menções bancárias). |
| **Regras de Email** | Validação de sintaxe, classificação de domínio (gratuito/descartável/educacional/governamental/corporativo/suspeito), detecção de typosquatting (distância de Levenshtein), análise do local-part. |
| **Classificação de Risco** | `0-1` → verde, `2-3` → amarelo, `4+` → vermelho (soma ponderada de regras atingidas). |

---

## 2. Requisitos Não Funcionais (RSNF) — FURPS+ / ISO 25010

### 2.1 Segurança (FURPS+ — Security / ISO 25010: Confiança)

#### RSNF-S01: Criptografia de Senhas

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-S01 |
| **Descrição** | Senhas de administradores devem ser armazenadas com criptografia unidirecional (hash) usando algoritmo seguro com salt aleatório. |
| **Algoritmo** | **bcrypt** com fator de custo (salt rounds) ≥ 10. |
| **Justificativa** | bcrypt é amplamente reconhecido como seguro contra ataques de brute-force e rainbow tables. O salt aleatório garante que senhas idênticas produzem hashes diferentes. |
| **Implementação** | `bcrypt.hash(senha, 10)` para geração; `bcrypt.compare(senha, hash)` para verificação. |
| **Regra de Negócio** | Senhas nunca devem ser armazenadas em texto claro. O campo `senha_hash` na tabela `usuarios` contém apenas o hash bcrypt. |

#### RSNF-S02: Autenticação e Autorização Stateless (JWT)

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-S02 |
| **Descrição** | Autenticação de administradores via JSON Web Token (JWT) stateless, transmitido no cabeçalho HTTP `Authorization: Bearer <token>`. |
| **Padrão** | RFC 7519 (JSON Web Token) |
| **Componentes do Token** | Header (alg: HS256), Payload (id, nome, email, perfil, iat, exp), Signature (HMAC-SHA256 com `JWT_SECRET`). |
| **Validade** | 24 horas (configurável via variável de ambiente). |
| **Propagação** | Cabeçalho `Authorization: Bearer <token>` em todas as requisições autenticadas. |
| **Revogação** | Implementação básica: expiração temporal. Não há blacklist de tokens (limitação de escopo). |
| **Armazenamento no Cliente** | `localStorage` do navegador ou cookie HTTP-Only (decisão de implementação). |

#### RSNF-S03: Sanitização contra XSS

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-S03 |
| **Descrição** | Sanitização ativa de toda entrada contra Cross-Site Scripting (XSS) usando biblioteca `validator.js` e escape de HTML entities. |
| **Camadas de Proteção** | 1. **Client-side:** `trim()` + `escape()` antes do envio.<br>2. **Server-side:** `validator.trim()` + `validator.escape()` no middleware de validação.<br>3. **Output encoding:** Variáveis inseridas no DOM são tratadas como texto (não como HTML). |
| **Biblioteca** | `validator` v13.15.35 (npm) |
| **Regras** | - Remover espaços em branco extras (trim).<br>- Converter caracteres especiais HTML (`<`, `>`, `&`, `"`, `'`) em entidades HTML (`&lt;`, `&gt;`, `&amp;`, `&quot;`, `&#x27;`). |

#### RSNF-S04: Prevenção de SQL Injection

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-S04 |
| **Descrição** | Prevenção de SQL Injection via Prepared Statements / query parametrizada em todas as interações com o banco de dados. |
| **Mecanismo** | `better-sqlite3` suporta Prepared Statements nativamente via placeholders `?`. |
| **Regra** | TODAS as queries SQL devem usar parâmetros posicionais (`?`). Nunca concatenar strings de entrada diretamente em queries SQL. |
| **Exemplo** | `db.prepare('SELECT * FROM alertas_golpes WHERE id = ?').get(id)` |

#### RSNF-S05: Cabeçalhos de Segurança HTTP (Helmet)

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-S05 |
| **Descrição** | Aplicação de cabeçalhos de segurança HTTP via middleware `helmet.js` v8.3.0. |
| **Cabeçalhos Protegidos** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0` (desabilitado em favor do CSP), `Strict-Transport-Security`, `Content-Security-Policy` (configurável — desabilitado para Web Speech API). |
| **Exceção** | CSP (Content Security Policy) pode ser desabilitado ou relaxado para permitir a Web Speech API e CDN de Tailwind CSS. |

#### RSNF-S06: Controle de Origem (CORS)

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-S06 |
| **Descrição** | Controle de Cross-Origin Resource Sharing (CORS) via middleware `cors` v2.8.6. |
| **Configuração** | `origin` configurável via variável de ambiente `ORIGEM_PERMITIDA`. Default: `*` (qualquer origem — para desenvolvimento). |
| **Recomendação** | Em produção, restringir `origin` para o domínio específico da aplicação. |

#### RSNF-S07: Limite de Tamanho de Payload

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-S07 |
| **Descrição** | Limitação do tamanho do corpo da requisição JSON para prevenir ataques de denial-of-service via payloads grandes. |
| **Configuração** | `express.json({ limit: '10kb' })` — máximo de 10 kilobytes por requisição. |

#### RSNF-S08: Privacidade por Design (LGPD)

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-S08 |
| **Descrição** | O conteúdo submetido para análise heurística é processado inteiramente em memória e NUNCA é persistido no banco de dados. Apenas metadados anônimos são registrados. |
| **Dados Anonimizados** | `tipo_entrada` (string), `risco` (string), `regras_atingidas` (string — nomes das regras separados por vírgula). |
| **Dados NÃO Persistidos** | O conteúdo real (link, texto, chave Pix, telefone, e-mail) é descartado após o processamento. |
| **Service Worker** | Requisições de API NÃO são armazenadas em cache (network-only) para garantir que dados sensíveis não residam em cache do navegador. |

---

### 2.2 Performance (FURPS+ — Performance / ISO 25010: Eficiência de Desempenho)

#### RSNF-P01: Tempo de Resposta da Análise

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-P01 |
| **Descrição** | O tempo total de processamento de uma análise heurística deve ser inferior a **3 segundos** (incluindo I/O de rede e persistência de metadados). |
| **Métrica** | Campo `tempo_ms` na resposta da API (`POST /api/analises`). |
| **Componentes Medidos** | Tempo de validação + tempo do motor heurístico + tempo de INSERT no banco (metadados). |
| **Otimização** | Motor heurístico é puramente computacional (sem chamadas externas), executado de forma síncrona (adequado para better-sqlite3). |

#### RSNF-P02: Concorrência de I/O Não Bloqueante

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-P02 |
| **Descrição** | O Event Loop do Node.js não deve ser bloqueado por operações longas. Operações de I/O (rede, banco) devem ser não bloqueantes. |
| **Mecanismo** | `better-sqlite3` é síncrono, mas opera com operações de banco rápidas (WAL mode). O Event Loop não é bloqueado significativamente devido à baixa latência do SQLite local. |
| **Risco Mitigado** | Bloqueio do Event Loop causando degradação de performance para múltiplos clientes simultâneos. |
| **Estratégia** | Operações pesadas de CPU (motor heurístico) são executadas de forma síncrona mas com tempo de execução controlado (< 100ms por chamada). |

#### RSNF-P03: Gerenciamento de Pool de Conexões

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-P03 |
| **Descrição** | Gerenciamento eficiente do pool de conexões com o banco de dados SQLite. |
| **Mecanismo** | `better-sqlite3` utiliza uma única conexão síncrona com modo WAL (Write-Ahead Logging) para concorrência de leitura. |
| **WAL Mode** | `PRAGMA journal_mode=WAL` — permite leitura e escrita concorrentes sem bloqueio. |
| **Foreign Keys** | `PRAGMA foreign_keys=ON` — garante integridade referencial a nível de banco. |

---

### 2.3 Confiabilidade (FURPS+ — Reliability / ISO 25010: Maturidade e Tolerância a Falhas)

#### RSNF-R01: Modo de Escrita WAL

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-R01 |
| **Descrição** | O banco SQLite opera em modo WAL (Write-Ahead Logging) para garantir consistência em caso de falha e concorrência segura. |
| **Vantagens** | - Leitores não bloqueiam escritores.<br>- Escritores não bloqueiam leitores.<br>- Recuperação automática após falha (crash recovery). |
| **Configuração** | `PRAGMA journal_mode=WAL` executado na inicialização da conexão. |

#### RSNF-R02: Integridade Referencial

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-R02 |
| **Descrição** | Chaves estrangeiras são habilitadas e aplicadas pelo banco de dados. |
| **Configuração** | `PRAGMA foreign_keys=ON` executado na inicialização da conexão. |

#### RSNF-R03: Tratamento de Erros Global

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-R03 |
| **Descrição** | Todas as rotas devem tratar erros adequadamente, retornando códigos HTTP apropriados e mensagens de erro genéricas (sem vazar detalhes internos). |
| **Padrão** | Try/catch em controladores; middleware de erro global (se implementado). |
| **Resposta Padrão — Erro** | `{ "sucesso": false, "erro": "Erro interno do servidor" }` com status `500`. |

#### RSNF-R04: Verificação de Saúde (Health Check)

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-R04 |
| **Descrição** | Endpoint de health check que verifica a disponibilidade do serviço e do banco de dados. |
| **Endpoint** | `GET /api/health` |
| **Resposta** | `{ "sucesso": true, "mensagem": "Hestia API operacional", "timestamp": string }` |

---

### 2.4 Usabilidade (FURPS+ — Usability / ISO 25010: Acessibilidade e Adequação Ergonômica)

#### RSNF-U01: Acessibilidade WCAG 2.1 Nível AA

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-U01 |
| **Descrição** | A interface deve atender aos critérios de acessibilidade WCAG 2.1 Nível AA. |
| **Implementações** | - Fonte base 18px (1.125rem) para legibilidade.<br>- Tamanhos de fonte escaláveis (normal/grande/extra) via `data-fonte`.<br>- Tema de alto contraste (`data-tema="alto-contraste"`).<br>- Foco visível (3px solid amber) em todos os elementos interativos.<br>- Roles ARIA (`role="tablist"`, `role="tabpanel"`, `role="tab"`).<br>- `aria-selected` para abas ativas.<br>- `aria-live="polite"` para resultados dinâmicos.<br>- `aria-modal="true"` e `role="dialog"` para modais. |

#### RSNF-U02: Redução de Movimento

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-U02 |
| **Descrição** | Respeitar a preferência do sistema operacional `prefers-reduced-motion` desativando animações. |
| **Implementação** | `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }` |

#### RSNF-U03: Suporte a Dispositivos Móveis

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-U03 |
| **Descrição** | A interface deve ser responsiva e funcionar adequadamente em dispositivos móveis (smartphones e tablets). |
| **Mecanismo** | Viewport meta tag, layout flexível, tamanhos de toque adequados (mín. 44x44px). |

#### RSNF-U04: PWA e Funcionamento Offline

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-U04 |
| **Descrição** | A aplicação deve funcionar como Progressive Web App (PWA) com cache offline de assets estáticos. |
| **Componentes** | `manifest.webmanifest` (nome, ícone, display standalone, cor do tema), `service-worker.js` (cache-first para assets, network-only para API). |

---

### 2.5 Arquitetura (FURPS+ — Architecture / ISO 25010: Manutenibilidade e Modularidade)

#### RSNF-A01: Arquitetura MVC-like

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-A01 |
| **Descrição** | O backend segue padrão arquitetural semelhante a MVC (Model-View-Controller) com separação de responsabilidades. |
| **Camadas** | - **Rotas** (`rotas/`): Definem endpoints HTTP e delegam para controladores.<br>- **Controladores** (`controladores/`): Validam entrada, orquestram lógica e formatam resposta.<br>- **Utilitários** (`utilitarios/`): Lógica de negócio pura (motor heurístico, validadores).<br>- **Configuração** (`config/`): Dados estáticos, conexão com banco, listas de referência.<br>- **Persistência**: Banco SQLite via `better-sqlite3` com Prepared Statements. |

#### RSNF-A02: Separação Frontend/Backend

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-A02 |
| **Descrição** | Frontend (HTML5/CSS3/JS ES6+) e Backend (Node.js/Express) estão em diretórios separados e comunicam via API REST JSON. |
| **Frontend** | `/frontend/` — arquivos estáticos servidos por `express.static`. |
| **Backend** | `/api/` — servidor Express com rotas, controladores, utilitários e config. |
| **Comunicação** | Requisições HTTP/HTTPS com payloads JSON. |

#### RSNF-A03: Modularização do Frontend

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-A03 |
| **Descrição** | O frontend é modularizado em módulos ES6 com responsabilidades específicas. |
| **Módulos** | - `app.js`: Ponto de entrada, navegação, acessibilidade, toast.<br>- `analise.js`: Formulário de análise, renderização do semáforo.<br>- `alertas.js`: Listagem, filtros, cards de alertas.<br>- `guia.js`: Guia pós-golpe, checkbox de progresso.<br>- `voz.js`: Web Speech API (entrada e saída de voz). |

#### RSNF-A04: Module System

| Campo | Descrição |
|-------|-----------|
| **ID** | RSNF-A04 |
| **Descrição** | Backend usa CommonJS (`require`/`module.exports`). Frontend usa ES Modules (`import`/`export`). |
| **Justificativa** | CommonJS é o padrão nativo do Node.js. ES Modules são o padrão moderno para browsers, suportados via `<script type="module">`. |

---

## 3. Diagramas de Sequência de Backend

### 3.1 DS-Backend-01: Fluxo Interno — POST /api/analises

```plantuml
@startuml DS_Backend_Analise
skinparam backgroundColor #FEFEFE
skinparam sequenceArrowThickness 2
skinparam sequenceLifeLineBorderColor #666666

title Diagrama de Sequência — DS-Backend-01: Fluxo Interno\nPOST /api/analises (Rota → Middleware → Controller → Service → DB → Auditoria)

participant "Cliente\n(Frontend)" as Client
participant "Express\nRouter" as Router
participant "Middleware\nValidação" as MW
participant "analiseControlador" as Controller
participant "analisadorGolpes" as Engine
participant "validadores" as Validators
database "SQLite\n(hestia.db)" as DB

== Requisição ==

Client -> Router : POST /api/analises\nContent-Type: application/json\nBody: { tipo, conteudo }
activate Router

Router -> Router : express.json({ limit: '10kb' })
Router -> Router : helmet() headers
Router -> Router : cors() validation

Router -> MW : Passa para middleware de validação
activate MW

MW -> MW : Extrai body da requisição
MW -> MW : validator.trim(tipo)
MW -> MW : validator.trim(conteudo)
MW -> MW : validator.escape(conteudo)

MW -> Validators : validarAnalise(tipo, conteudo)
activate Validators

Validators -> Validators : Verifica tipo ∈ [link, texto, pix, telefone, email]
Validators -> Validators : Verifica conteudo.length >= 3 && <= 2000
Validators -> Validators : Verifica campos obrigatórios

alt Validação falhou
  Validators --> MW : { valido: false, erro: "..." }
  MW --> Router : 400 Bad Request\n{ sucesso: false, erro }
  Router --> Client : 400 Bad Request
  deactivate Validators
  deactivate MW
  deactivate Router
else Validação OK
  Validators --> MW : { valido: true }
  deactivate Validators

  MW -> MW : req.body sanitizado
  MW --> Router : next()
  deactivate MW

  Router -> Controller : analisarConteudo(req, res)
  activate Controller

  Controller -> Controller : Extrai { tipo, conteudo } de req.body

  == Invocação do Motor Heurístico ==

  Controller -> Engine : analisar(conteudo, tipo)
  activate Engine

  Engine -> Engine : Registra tempo inicial\n(Date.now())

  alt tipo === "link"
    Engine -> Engine : avaliarLink(conteudo)\n→ shorteners, TLDs, HTTPS,\nimpersonação de marca
  else tipo === "texto"
    Engine -> Engine : avaliarTexto(conteudo)\n→ palavras risco, CAPS,\nexclamações, URLs
  else tipo === "pix"
    Engine -> Engine : avaliarPix(conteudo)\n→ formato chave, instruções
  else tipo === "telefone"
    Engine -> Engine : avaliarTelefone(conteudo)\n→ DDD, normalização, tipo,\nrepetição, flags contextuais
  else tipo === "email"
    Engine -> Engine : avaliarEmail(conteudo)\n→ sintaxe, domínio,\ntyposquatting, local-part
  end

  Engine -> Engine : Calcula soma de pontos\npor regras atingidas
  Engine -> Engine : Classifica risco:\n[0-1]=verde, [2-3]=amarelo, [4+]=vermelho
  Engine -> Engine : Gera resumo textual
  Engine -> Engine : Registra tempo final\n Calcula tempo_ms

  Engine --> Controller : { risco, regras_atingidas,\nregras_detalhes, resumo, tempo_ms }
  deactivate Engine

  == Persistência de Metadados Anônimos ==

  Controller -> DB : db.prepare(\n'INSERT INTO estatisticas_analise\n(tipo_entrada, risco, regras_atingidas)\nVALUES (?, ?, ?)'\n).run(tipo, risco, regras_atingidas)
  activate DB
  DB --> Controller : { changes: 1, lastInsertRowid }
  deactivate DB

  == Formatação da Resposta ==

  Controller -> Controller : Monta objeto resposta:\n{\n  sucesso: true,\n  risco,\n  regras_atingidas,\n  regras_detalhes,\n  resumo,\n  tempo_ms\n}

  Controller --> Client : 200 OK\n{ sucesso: true, risco, ... }
  deactivate Controller

end

deactivate Router

@enduml
```

---

### 3.2 DS-Backend-02: Fluxo Interno — GET /api/alertas (com filtros)

```plantuml
@startuml DS_Backend_Alertas
skinparam backgroundColor #FEFEFE
skinparam sequenceArrowThickness 2
skinparam sequenceLifeLineBorderColor #666666

title Diagrama de Sequência — DS-Backend-02: Fluxo Interno\nGET /api/alertas (Rota → Controller → DB → Resposta)

participant "Cliente\n(Frontend)" as Client
participant "Express\nRouter" as Router
participant "alertaControlador" as Controller
database "SQLite\n(hestia.db)" as DB

== Requisição ==

Client -> Router : GET /api/alertas?regiao=Sudeste&categoria=Financeiro
activate Router

Router -> Router : helmet() headers
Router -> Router : cors() validation

Router -> Controller : listarAlertas(req, res)
activate Controller

Controller -> Controller : Extrai query params:\nregiao = req.query.regiao\nregiao = req.query.regiao\n(cada um pode ser undefined)

Controller -> Controller : Monta query SQL dinâmica:\n\nSELECT * FROM alertas_golpes\nWHERE 1=1\n[AND regiao LIKE ?]\n[AND categoria LIKE ?]\nORDER BY data_publicacao DESC\nLIMIT 50

Controller -> Controller : Monta array de parâmetros:\nparams = []\nif (regiao) params.push('%' + regiao + '%')\nif (categoria) params.push('%' + categoria + '%')

Controller -> DB : db.prepare(query).all(...params)
activate DB

DB -> DB : Executa query com parâmetros\n(preparsed, safe from SQL injection)
DB -> DB : Retorna até 50 registros\nordenados por data_publicacao DESC

DB --> Controller : Array de registros\n[{ id, titulo, descricao, regiao,\ncategoria, nivel_risco, data_publicacao }]
deactivate DB

Controller -> Controller : Formata resposta:\n{\n  sucesso: true,\n  dados: registros\n}

Controller --> Client : 200 OK\n{ sucesso: true, dados: [...] }
deactivate Controller

deactivate Router

@enduml
```

---

### 3.3 DS-Backend-03: Fluxo Interno — POST /api/alertas (Cadstro com Auth)

```plantuml
@startuml DS_Backend_Cadastro
skinparam backgroundColor #FEFEFE
skinparam sequenceArrowThickness 2
skinparam sequenceLifeLineBorderColor #666666

title Diagrama de Sequência — DS-Backend-03: Fluxo Interno\nPOST /api/alertas (Rota → Auth Middleware → Validation → Controller → DB)

participant "Admin\n(Frontend)" as Admin
participant "Express\nRouter" as Router
participant "Middleware\nJWT Auth" as Auth
participant "Middleware\nValidação" as MW
participant "alertaControlador" as Controller
database "SQLite\n(hestia.db)" as DB

== Requisição Autenticada ==

Admin -> Router : POST /api/alertas\nAuthorization: Bearer eyJhbG...\nContent-Type: application/json\nBody: { titulo, descricao, regiao, categoria, nivel_risco }
activate Router

Router -> Router : express.json({ limit: '10kb' })
Router -> Router : helmet() headers
Router -> Router : cors() validation

Router -> Auth : Passa para middleware de autenticação
activate Auth

Auth -> Auth : Extrai token do\ncabeçalho Authorization\n(req.headers.authorization)
Auth -> Auth : Remove prefixo "Bearer "
Auth -> Auth : jwt.verify(token, JWT_SECRET)

alt Token inválido ou expirado
  Auth --> Router : Erro: "Token inválido ou expirado"
  Router --> Admin : 401 Unauthorized\n{ sucesso: false, erro: "..." }
  deactivate Auth
  deactivate Router
else Token válido
  Auth -> Auth : Decodifica payload:\n{ id, nome, email, perfil }
  Auth -> Auth : req.usuario = payload
  Auth --> Router : next()
  deactivate Auth

  Router -> MW : Passa para middleware de validação
  activate MW

  MW -> MW : validator.trim() em todos os campos
  MW -> MW : validator.escape() em todos os campos

  MW -> MW : validarAlerta(dados):
  MW -> MW : titulo: máx. 200 chars, obrigatório
  MW -> MW : descricao: máx. 2000 chars, obrigatório
  MW -> MW : regiao: máx. 100 chars, obrigatório
  MW -> MW : categoria: máx. 100 chars, obrigatório
  MW -> MW : nivel_risco ∈ [verde, amarelo, vermelho]

  alt Validação falhou
    MW --> Router : 400 Bad Request\n{ erro: "..." }
    Router --> Admin : 400 Bad Request
    deactivate MW
    deactivate Router
  else Validação OK
    MW --> Router : next()
    deactivate MW

    Router -> Controller : cadastrarAlerta(req, res)
    activate Controller

    Controller -> Controller : Extrai dados de req.body
    Controller -> Controller : req.usuario disponível (do Auth middleware)

    Controller -> DB : db.prepare(\n'INSERT INTO alertas_golpes\n(titulo, descricao, regiao, categoria, nivel_risco)\nVALUES (?, ?, ?, ?, ?)'\n).run(titulo, descricao, regiao, categoria, nivel_risco)
    activate DB
    DB --> Controller : { changes: 1, lastInsertRowid: id }
    deactivate DB

    Controller -> Controller : Formata resposta:\n{\n  sucesso: true,\n  mensagem: "Alerta cadastrado com sucesso"\n}

    Controller --> Admin : 201 Created\n{ sucesso: true, mensagem: "..." }
    deactivate Controller

  end
end

deactivate Router

@enduml
```

---

### 3.4 DS-Backend-04: Fluxo Interno — Verificação de Autenticação JWT

```plantuml
@startuml DS_Backend_Auth
skinparam backgroundColor #FEFEFE
skinparam sequenceArrowThickness 2
skinparam sequenceLifeLineBorderColor #666666

title Diagrama de Sequência — DS-Backend-04: Fluxo Interno\nMiddleware de Autenticação JWT

participant "Cliente\n(Frontend)" as Client
participant "Express\nRouter" as Router
participant "autenticarJWT\n(Middleware)" as Auth
participant "jwt\n(biblioteca)" as JWT

== Requisição com Token ==

Client -> Router : GET/POST /api/rota-protegida\nAuthorization: Bearer eyJhbGc...
activate Router

Router -> Auth : auth(req, res, next)
activate Auth

Auth -> Auth : const authHeader =\nreq.headers.authorization

alt authHeader ausente
  Auth --> Router : 401 Unauthorized\n{ erro: "Token não fornecido" }
  deactivate Auth
  deactivate Router
else authHeader presente
  Auth -> Auth : const [scheme, token] =\nauthHeader.split(' ')

  alt scheme !== "Bearer" ou token ausente
    Auth --> Router : 401 Unauthorized\n{ erro: "Formato de token inválido" }
    deactivate Auth
    deactivate Router
  else scheme === "Bearer" e token presente

    Auth -> JWT : jwt.verify(token, JWT_SECRET)
    activate JWT

    alt JWT.verify lança exceção
      JWT --> Auth : JsonWebTokenError\nou TokenExpiredError

      alt TokenExpiredError
        Auth --> Router : 401 Unauthorized\n{ erro: "Token expirado" }
      else JsonWebTokenError
        Auth --> Router : 401 Unauthorized\n{ erro: "Token inválido" }
      end

      deactivate JWT
      deactivate Auth
      deactivate Router
    else JWT.verify retorna payload
      JWT --> Auth : payload = { id, nome, email, perfil, iat, exp }
      deactivate JWT

      Auth -> Auth : req.usuario = payload
      Auth --> Router : next()
      deactivate Auth

      Router -> Router : Rota continua normalmente

    end
  end
end

deactivate Router

@enduml
```

---

## 4. Diagrama Estrutural de Classes de Domínio

### 4.1 Diagrama de Classes com Invariantes OCL

```plantuml
@startuml Classes_Dominio
skinparam backgroundColor #FEFEFE
skinparam classAttributeIconSize 0
skinparam classFontSize 12
skinparam defaultFontName Arial
skinparam defaultFontSize 11

title Diagrama de Classes de Domínio — Hestia: Alerta Cidadão\nCom Invariantes OCL (Object Constraint Language)

package "Domínio de Análise" {

  class ConteudoAnalisavel {
    - id : Integer
    - tipo : TipoConteudo
    - conteudo : String
    - dataSubmissao : DateTime
    + getTipo() : TipoConteudo
    + getConteudo() : String
    + ehValido() : Boolean
  }

  enum TipoConteudo {
    LINK
    TEXTO
    PIX
    TELEFONE
    EMAIL
  }

  class ResultadoAnalise {
    - id : Integer
    - risco : NivelRisco
    - regrasAtingidas : String
    - regrasDetalhes : List<RegraHeuristica>
    - resumo : String
    - tempoMs : Integer
    + getRisco() : NivelRisco
    + getRegrasAtingidas() : List<String>
    + getResumo() : String
  }

  enum NivelRisco {
    VERDE
    AMARELO
    VERMELHO
  }

  class RegraHeuristica {
    - nome : String
    - descricao : String
    - pontuacao : Integer
    - severidade : SeveridadeRegra
    + getNome() : String
    + getPontuacao() : Integer
  }

  enum SeveridadeRegra {
    ALTA
    MEDIA
    BAIXA
  }

  ConteudoAnalisavel --> TipoConteudo : possui
  ResultadoAnalise --> NivelRisco : classifica
  ResultadoAnalise --> RegraHeuristica : aciona 0..*
  RegraHeuristica --> SeveridadeRegra : possui
}

package "Domínio de Alertas" {

  class AlertaGolpe {
    - id : Integer
    - titulo : String
    - descricao : String
    - regiao : String
    - categoria : String
    - nivelRisco : NivelRisco
    - dataPublicacao : DateTime
    + getTitulo() : String
    + getDescricao() : String
    + getRegiao() : String
    + getCategoria() : String
    + getNivelRisco() : NivelRisco
    + getDataPublicacao() : DateTime
    + ehValido() : Boolean
  }

  class FiltroAlerta {
    - regiao : String
    - categoria : String
    + getRegiao() : String
    + getCategoria() : String
    + aplicar(listaAlertas) : List<AlertaGolpe>
  }
}

package "Domínio de Autenticação" {

  class Usuario {
    - id : Integer
    - nome : String
    - email : String
    - senhaHash : String
    - perfil : PerfilUsuario
    + getId() : Integer
    + getNome() : String
    + getEmail() : String
    + getPerfil() : PerfilUsuario
    + verificarSenha(senha) : Boolean
  }

  enum PerfilUsuario {
    ADMIN
    OPERADOR
    VISUALIZADOR
  }

  class TokenJWT {
    - token : String
    - dataExpiracao : DateTime
    + getToken() : String
    + estaValido() : Boolean
    + getPayload() : Object
  }
}

package "Domínio de Persistência" {

  class EstatisticaAnalise {
    - id : Integer
    - tipoEntrada : TipoConteudo
    - risco : NivelRisco
    - regrasAtingidas : String
    - criadoEm : DateTime
    + getTipoEntrada() : TipoConteudo
    + getRisco() : NivelRisco
  }

  class GuiaPosGolpe {
    - id : Integer
    - titulo : String
    - descricao : String
    - icone : String
    + getTitulo() : String
    + getDescricao() : String
  }
}

package "Motor Heurístico" {

  class MotorHeuristico {
    - regrasLink : List<RegraHeuristica>
    - regrasTexto : List<RegraHeuristica>
    - regrasPix : List<RegraHeuristica>
    - regrasTelefone : List<RegraHeuristica>
    - regrasEmail : List<RegraHeuristica>
    + analisar(conteudo, tipo) : ResultadoAnalise
    + avaliarLink(url) : ResultadoAnalise
    + avaliarTexto(texto) : ResultadoAnalise
    + avaliarPix(conteudo) : ResultadoAnalise
    + avaliarTelefone(telefone) : ResultadoAnalise
    + avaliarEmail(email) : ResultadoAnalise
  }

  class ValidadorEntrada {
    + validarAnalise(tipo, conteudo) : ValidationResult
    + validarAlerta(dados) : ValidationResult
    + sanitizar(conteudo) : String
  }

  class ResultadoValidacao {
    - valido : Boolean
    - erro : String
    + isValido() : Boolean
    + getErro() : String
  }
}

package "Infraestrutura" {

  class BancoDados {
    - conexao : Database
    + conectar() : void
    + executar(query, params) : Result
    + preparar(query) : Statement
  }

  class ExpressRouter {
    - rotas : List<Rota>
    + registrar(method, path, ...handlers) : void
  }

  class Middleware {
    + autenticarJWT(req, res, next) : void
    + validarEntrada(req, res, next) : void
    + registrarCORS(req, res, next) : void
  }
}

' --- Relações ---

ConteudoAnalisavel --> ResultadoAnalise : gera
MotorHeuristico --> ResultadoAnalise : produz
MotorHeuristico --> RegraHeuristica : utiliza 1..*
ValidadorEntrada --> ResultadoValidacao : retorna
BancoDados --> EstatisticaAnalise : persiste
BancoDados --> AlertaGolpe : persiste
ExpressRouter --> Middleware : aplica
AlertaGolpe ..> NivelRisco : referencia
EstatisticaAnalise ..> NivelRisco : referencia
EstatisticaAnalise ..> TipoConteudo : referencia
Usuario --> TokenJWT : gera
FiltroAlerta ..> AlertaGolpe : filtra

' --- Invariantes OCL ---

note bottom of ConteudoAnalisavel
  **Invariantes OCL:**
  
  context ConteadoAnalisavel
  inv tipoNaoNulo: self.tipo <> null
  inv conteudoNaoVazio: self.conteudo.length() >= 3
  inv conteudoLimite: self.conteudo.length() <= 2000
  inv tipoValido: self.tipo in
    {LINK, TEXTO, PIX, TELEFONE, EMAIL}
end note

note bottom of ResultadoAnalise
  **Invariantes OCL:**
  
  context ResultadoAnalise
  inv riscoValido: self.risco in
    {VERDE, AMARELO, VERMELHO}
  inv regrasNaoVazias:
    self.regrasAtingidas <> null
  inv tempoPositivo: self.tempoMs > 0
  inv resumoNaoVazio:
    self.resumo.length() > 0
end note

note bottom of AlertaGolpe
  **Invariantes OCL:**
  
  context AlertaGolpe
  inv tituloObrigatorio:
    self.titulo.length() > 0 and
    self.titulo.length() <= 200
  inv descricaoObrigatoria:
    self.descricao.length() > 0 and
    self.descricao.length() <= 2000
  inv regiaoObrigatoria:
    self.regiao.length() > 0
  inv categoriaObrigatoria:
    self.categoria.length() > 0
  inv nivelRiscoValido:
    self.nivelRisco in
    {VERDE, AMARELO, VERMELHO}
  inv dataPublicacaoDefinida:
    self.dataPublicacao <> null
end note

note bottom of Usuario
  **Invariantes OCL:**
  
  context Usuario
  inv emailValido:
    self.email.matches(
      '^[\\w.-]+@[\\w.-]+\\.\\w+$'
    )
  inv senhaHashArmazenada:
    self.senhaHash.length() > 0
  inv perfilValido:
    self.perfil in
    {ADMIN, OPERADOR, VISUALIZADOR}
  inv nomeNaoVazio:
    self.nome.length() > 0
end note

note bottom of EstatisticaAnalise
  **Invariantes OCL:**
  
  context EstatisticaAnalise
  inv tipoEntradaValido:
    self.tipoEntrada in
    {LINK, TEXTO, PIX, TELEFONE, EMAIL}
  inv riscoValido:
    self.risco in
    {VERDE, AMARELO, VERMELHO}
  inv criadoEmDefinido:
    self.criadoEm <> null
  **REgra de Negócio:**
  inv conteudoNaoPersistido:
    -- Apenas metadados são
    -- armazenados, nunca o
    -- conteúdo analisado
end note

note bottom of MotorHeuristico
  **Invariantes OCL:**
  
  context MotorHeuristico
  inv regrasConfiguradas:
    self.regrasLink.size() > 0 and
    self.regrasTexto.size() > 0 and
    self.regrasPix.size() > 0 and
    self.regrasTelefone.size() > 0 and
    self.regrasEmail.size() > 0
  inv saidaDeterministica:
    -- Para a mesma entrada,
    -- o resultado é sempre
    -- o mesmo
end note

@enduml
```

### 4.2 Regras de Transição de Status (OCL)

```
-- Regra de Transição de Nível de Risco
-- Aplicável a: AlertaGolpe, ResultadoAnalise

context AlertaGolpe
  inv transicaoRisco:
    -- O nível de risco pode ser alterado
    -- apenas por administradores autenticados
    -- e deve permanecer dentro do domínio válido
    self.nivelRisco in {VERDE, AMARELO, VERMELHO}

-- Regra de Transição de Autenticação
-- Aplicável a: TokenJWT

context TokenJWT
  inv transicaoToken:
    -- Token pode transitar entre:
    -- Válido (estaValido() = true) → Expirado (estaValido() = false)
    -- Após expiração, novo login é necessário
    self.estaValido() implies
      self.dataExpiracao > DateTime.now()

-- Regra de Transição de Conclusão do Guia
-- Aplicável a: GuiaPosGolpe (client-side)

context GuiaPosGolpe
  inv transicaoGuia:
    -- Etapas podem transitar entre:
    -- Pendente → Concluída
    -- Concluída → Pendante (desmarcar)
    -- progresso = count(etapasConcluidas) / total
    true  -- lógica implementada no frontend
```

---

## 5. Dicionário Técnico de Dados (DDL)

### 5.1 Esquema Físico — SQLite

```sql
-- =====================================================
-- Dicionário de Dados — Hestia: Alerta Cidadão
-- Motor: SQLite via better-sqlite3
-- Modo: WAL (Write-Ahead Logging)
-- =====================================================

-- Configurações de Integridade
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- =====================================================
-- Tabela: alertas_golpes
-- Descrição: Armazena os alertas de golpes cadastrados
--            por administradores do sistema.
-- =====================================================

CREATE TABLE IF NOT EXISTS alertas_golpes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    
    titulo          TEXT NOT NULL
                    CHECK(length(titulo) > 0 AND length(titulo) <= 200),
    
    descricao       TEXT NOT NULL
                    CHECK(length(descricao) > 0 AND length(descricao) <= 2000),
    
    regiao          TEXT NOT NULL
                    CHECK(length(regiao) > 0 AND length(regiao) <= 100),
    
    categoria       TEXT NOT NULL
                    CHECK(length(categoria) > 0 AND length(categoria) <= 100),
    
    nivel_risco     TEXT NOT NULL
                    CHECK(nivel_risco IN ('verde', 'amarelo', 'vermelho')),
    
    data_publicacao TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_alertas_regiao
    ON alertas_golpes(regiao);

CREATE INDEX IF NOT EXISTS idx_alertas_categoria
    ON alertas_golpes(categoria);

-- =====================================================
-- Tabela: estatisticas_analise
-- Descrição: Armazena metadados anônimos das análises
--            realizadas. O conteúdo analisado NUNCA é
--            persistido (conformidade LGPD).
-- =====================================================

CREATE TABLE IF NOT EXISTS estatisticas_analise (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    
    tipo_entrada     TEXT NOT NULL
                     CHECK(tipo_entrada IN ('link', 'texto', 'pix', 'telefone', 'email')),
    
    risco            TEXT NOT NULL
                     CHECK(risco IN ('verde', 'amarelo', 'vermelho')),
    
    regras_atingidas TEXT DEFAULT NULL,
    
    criado_em        TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_estatisticas_risco
    ON estatisticas_analise(risco);
```

### 5.2 Dicionário de Dados Detalhado

#### Tabela `alertas_golpes`

| Coluna | Tipo | Constraint | Default | Descrição | Índice |
|--------|------|------------|---------|-----------|--------|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Gerado automaticamente | Identificador único do alerta. Chave primária autoincrementável. | Primário |
| `titulo` | `TEXT` | `NOT NULL`, `CHECK(length > 0 AND length <= 200)` | — | Título curto do alerta. Máximo 200 caracteres. | — |
| `descricao` | `TEXT` | `NOT NULL`, `CHECK(length > 0 AND length <= 2000)` | — | Descrição detalhada do golpe. Máximo 2000 caracteres. | — |
| `regiao` | `TEXT` | `NOT NULL`, `CHECK(length > 0 AND length <= 100)` | — | Região geográfica do alerta (ex: "Centro-Oeste", "Sudeste"). Máximo 100 caracteres. | `idx_alertas_regiao` |
| `categoria` | `TEXT` | `NOT NULL`, `CHECK(length > 0 AND length <= 100)` | — | Categoria do golpe (ex: "Financeiro", "Digital", "Telefônico"). Máximo 100 caracteres. | `idx_alertas_categoria` |
| `nivel_risco` | `TEXT` | `NOT NULL`, `CHECK(IN ('verde', 'amarelo', 'vermelho'))` | — | Nível de risco do alerta. Valores permitidos: 'verde', 'amarelo', 'vermelho'. | — |
| `data_publicacao` | `TEXT` | — | `datetime('now', 'localtime')` | Data e hora da publicação do alerta. Formato ISO 8601 com fuso horário local. | — |

#### Tabela `estatisticas_analise`

| Coluna | Tipo | Constraint | Default | Descrição | Índice |
|--------|------|------------|---------|-----------|--------|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Gerado automaticamente | Identificador único da estatística. Chave primária autoincrementável. | Primário |
| `tipo_entrada` | `TEXT` | `NOT NULL`, `CHECK(IN ('link', 'texto', 'pix', 'telefone', 'email'))` | — | Tipo do conteúdo analisado. Valores permitidos: 'link', 'texto', 'pix', 'telefone', 'email'. | — |
| `risco` | `TEXT` | `NOT NULL`, `CHECK(IN ('verde', 'amarelo', 'vermelho'))` | — | Nível de risco classificado. Valores permitidos: 'verde', 'amarelo', 'vermelho'. | `idx_estatisticas_risco` |
| `regras_atingidas` | `TEXT` | `DEFAULT NULL` | `NULL` | Lista de nomes das regras acionadas, separadas por vírgula. Ex: "URL_CURTA,SEM_HTTPS". Pode ser NULL se nenhuma regra foi acionada. | — |
| `criado_em` | `TEXT` | — | `datetime('now', 'localtime')` | Data e hora do registro. Formato ISO 8601 com fuso horário local. | — |

### 5.3 Regras de Integridade

| Regra | Tipo | Tabela | Coluna | Descrição |
|-------|------|--------|--------|-----------|
| RI-01 | CHECK | `alertas_golpes` | `nivel_risco` | Valores permitidos: 'verde', 'amarelo', 'vermelho' |
| RI-02 | CHECK | `alertas_golpes` | `titulo` | Comprimento entre 1 e 200 caracteres |
| RI-03 | CHECK | `alertas_golpes` | `descricao` | Comprimento entre 1 e 2000 caracteres |
| RI-04 | CHECK | `alertas_golpes` | `regiao` | Comprimento entre 1 e 100 caracteres |
| RI-05 | CHECK | `alertas_golpes` | `categoria` | Comprimento entre 1 e 100 caracteres |
| RI-06 | CHECK | `estatisticas_analise` | `tipo_entrada` | Valores permitidos: 'link', 'texto', 'pix', 'telefone', 'email' |
| RI-07 | CHECK | `estatisticas_analise` | `risco` | Valores permitidos: 'verde', 'amarelo', 'vermelho' |
| RI-08 | NOT NULL | `alertas_golpes` | `titulo`, `descricao`, `regiao`, `categoria`, `nivel_risco` | Campos obrigatórios — não podem ser NULL |
| RI-09 | NOT NULL | `estatisticas_analise` | `tipo_entrada`, `risco` | Campos obrigatórios — não podem ser NULL |
| RI-10 | DEFAULT | `alertas_golpes` | `data_publicacao` | Valor padrão: data/hora atual do sistema |
| RI-11 | DEFAULT | `estatisticas_analise` | `criado_em` | Valor padrão: data/hora atual do sistema |

### 5.4 Dados Seed (Inserção Inicial)

```sql
-- Dados iniciais de alertas (8 registros)
INSERT INTO alertas_golpes (titulo, descricao, regiao, categoria, nivel_risco) VALUES
('Golpe Pix Falso — Falso Banco', 'Golpista se passa por funcionário de banco e solicita transferência Pix para "conta segura".', 'Nacional', 'Financeiro', 'vermelho'),
('Golpe de Ligação Falsa — "Banco Central"', 'Ligação fraudulenta informando que sua conta foi bloqueada e solicita dados pessoais.', 'Nacional', 'Telefônico', 'vermelho'),
('Vaga de Emprego Falsa — "Trabalhe de Casa"', 'Anúncio de vaga com salário alto que solicita pagamento antecipado para "material de trabalho".', 'Sudeste', 'Digital', 'amarelo'),
('Falso Bloqueio Pix — "CHAVE PIX BLOQUEADA"', 'Mensagem de texto informando que sua chave Pix foi bloqueada e solicita clique em link.', 'Nacional', 'Digital', 'vermelho'),
('Golpe do Prêmio Falso — "Você Ganhou!"', 'Mensagem informando que ganhou prêmio e precisa pagar "taxa de liberação".', 'Nacional', 'Digital', 'amarelo'),
('Clonagem de Voz com IA', 'Golpista usa inteligência artificial para clonar voz de familiar e solicitar dinheiro.', 'Sudeste', 'Telefônico', 'vermelho'),
('Loja Virtual Falsa — "Ofertas Imperdíveis"', 'Site fraudulento que recebe pagamento e nunca entrega os produtos.', 'Sudeste', 'Digital', 'amarelo'),
('Golpe do Falso INSS — "Aposentadoria Bloqueada'", 'Ligação ou mensagem informando que benefício do INSS está bloqueado e solicita dados.', 'Nacional', 'Governamental', 'vermelho');
```

---

## 6. Contratos de API RESTful

### 6.1 Rotas Públicas (Sem Autenticação)

| Método | Endpoint | Descrição | Payload Requisição | Payload Resposta (Sucesso) | Status Codes |
|--------|----------|-----------|-------------------|---------------------------|--------------|
| `GET` | `/api/health` | Health check do serviço | — | `{ "sucesso": true, "mensagem": "Hestia API operacional", "timestamp": "2026-09-08T12:00:00" }` | `200` |
| `POST` | `/api/analises` | Análise heurística de conteúdo | `{ "tipo": string, "conteudo": string }` | `{ "sucesso": true, "risco": string, "regras_atingidas": string, "regras_detalhes": [{ "nome": string, "descricao": string, "pontuacao": number }], "resumo": string, "tempo_ms": number }` | `200`, `400`, `500` |
| `GET` | `/api/alertas` | Listar alertas (filtros opcionais) | Query: `?regiao={string}&categoria={string}` | `{ "sucesso": true, "dados": [{ "id": number, "titulo": string, "descricao": string, "regiao": string, "categoria": string, "nivel_risco": string, "data_publicacao": string }] }` | `200`, `500` |
| `GET` | `/api/guia` | Obter guia pós-golpe | — | `{ "sucesso": true, "dados": [{ "id": number, "titulo": string, "descricao": string, "icone": string }] }` | `200`, `500` |

### 6.2 Rotas Administrativas (Com Autenticação JWT)

| Método | Endpoint | Descrição | Cabeçalho | Payload Requisição | Payload Resposta (Sucesso) | Status Codes |
|--------|----------|-----------|-----------|-------------------|---------------------------|--------------|
| `POST` | `/api/alertas` | Cadastrar novo alerta | `Authorization: Bearer <token>` | `{ "titulo": string, "descricao": string, "regiao": string, "categoria": string, "nivel_risco": string }` | `{ "sucesso": true, "mensagem": "Alerta cadastrado com sucesso" }` | `201`, `400`, `401`, `500` |

### 6.3 Detalhamento dos Status Codes

| Código | Significado | Quando Retornado |
|--------|-------------|------------------|
| `200 OK` | Requisição bem-sucedida | Operações de leitura (GET) e análise (POST /api/analises). |
| `201 Created` | Recurso criado com sucesso | Cadastro de novo alerta (POST /api/alertas autenticado). |
| `400 Bad Request` | Dados inválidos na requisição | Payload fora do schema, campos obrigatórios faltando, tipo inválido. |
| `401 Unauthorized` | Não autenticado | Token JWT ausente, inválido ou expirado em rota protegida. |
| `500 Internal Server Error` | Erro interno do servidor | Falha inesperada no processamento (erro de banco, exceção não tratada). |

### 6.4 Exemplos de Requisição e Resposta

#### Exemplo 1: POST /api/analises (Link Suspeito)

**Requisição:**
```http
POST /api/analises HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "tipo": "link",
  "conteudo": "http://bit.ly/3xFakeBank"
}
```

**Resposta (200 OK):**
```json
{
  "sucesso": true,
  "risco": "vermelho",
  "regras_atingidas": "URL_CURTA,SEM_HTTPS,IMPERSO_MARCA",
  "regras_detalhes": [
    {
      "nome": "URL_CURTA",
      "descricao": "URL encurtador detectado (bit.ly)",
      "pontuacao": 2
    },
    {
      "nome": "SEM_HTTPS",
      "descricao": "URL não utiliza HTTPS",
      "pontuacao": 1
    },
    {
      "nome": "IMPERSO_MARCA",
      "descricao": "Possível impersonação de marca conhecida",
      "pontuacao": 2
    }
  ],
  "resumo": "ALTO RISCO: Esta URL apresenta múltiplos indicadores de golpe. Recomendamos não acessar este link.",
  "tempo_ms": 45
}
```

#### Exemplo 2: GET /api/alertas?regiao=Sudeste

**Requisição:**
```http
GET /api/alertas?regiao=Sudeste HTTP/1.1
Host: localhost:3000
```

**Resposta (200 OK):**
```json
{
  "sucesso": true,
  "dados": [
    {
      "id": 3,
      "titulo": "Vaga de Emprego Falsa",
      "descricao": "Anúncio de vaga com salário alto que solicita pagamento antecipado.",
      "regiao": "Sudeste",
      "categoria": "Digital",
      "nivel_risco": "amarelo",
      "data_publicacao": "2026-09-01 10:30:00"
    }
  ]
}
```

#### Exemplo 3: POST /api/alertas (Cadastro Autenticado)

**Requisição:**
```http
POST /api/alertas HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

{
  "titulo": "Novo Golpe Detectado",
  "descricao": "Descrição detalhada do golpe.",
  "regiao": "Centro-Oeste",
  "categoria": "Financeiro",
  "nivel_risco": "vermelho"
}
```

**Resposta (201 Created):**
```json
{
  "sucesso": true,
  "mensagem": "Alerta cadastrado com sucesso"
}
```

**Resposta (401 Unauthorized):**
```json
{
  "sucesso": false,
  "erro": "Token inválido ou expirado"
}
```

---

## 7. Matriz Bidirecional de Rastreabilidade Técnica

### 7.1 Matriz RSF ↔ Componentes de Implementação

| RSF | Arquivo de Rotas | Arquivo de Controlador | Arquivo de Utilitário | Middleware | Tabela DB |
|-----|------------------|----------------------|---------------------|------------|-----------|
| RSF-01 | `analiseRotas.js` | `analiseControlador.js` | `analisadorGolpes.js`, `validadores.js` | `express.json`, `helmet`, `cors` | `estatisticas_analise` |
| RSF-02 | `alertaRotas.js` | `alertaControlador.js` | — | `helmet`, `cors` | `alertas_golpes` |
| RSF-03 | `alertaRotas.js` | `alertaControlador.js` | `validadores.js` | `express.json`, `helmet`, `cors`, `autenticarJWT` | `alertas_golpes` |
| RSF-04 | `guiaRotas.js` | `guiaControlador.js` | `listaGolpes.js` | `helmet`, `cors` | — (dados estáticos) |
| RSF-05 | `app.js` (inline) | — | — | `helmet`, `cors` | — |
| RSF-06 | `app.js` (static) | — | — | `express.static` | — |
| RSF-07 | — | — | — | `autenticarJWT.js` | — (verificação JWT) |
| RSF-08 | — | `analiseControlador.js` | `analisadorGolpes.js` | — | — (processamento em memória) |

### 7.2 Matriz RSNF ↔ Componentes de Implementação

| RSNF | Componente | Arquivo | Mecanismo |
|------|-----------|---------|-----------|
| RSNF-S01 | Criptografia de Senhas | `iniciarBanco.js` (seed), Auth middleware | `bcrypt.hash()` / `bcrypt.compare()` |
| RSNF-S02 | Autenticação JWT | `autenticarJWT.js` | `jwt.sign()` / `jwt.verify()` |
| RSNF-S03 | Sanitização XSS | `validadores.js` | `validator.trim()` / `validator.escape()` |
| RSNF-S04 | Prevenção SQL Injection | `conexaoBanco.js`, todos os controladores | `better-sqlite3` Prepared Statements (`?`) |
| RSNF-S05 | Cabeçalhos Segurança | `app.js` | `helmet()` middleware |
| RSNF-S06 | Controle CORS | `app.js` | `cors({ origin: ORIGEM_PERMITIDA })` |
| RSNF-S07 | Limite Payload | `app.js` | `express.json({ limit: '10kb' })` |
| RSNF-S08 | Privacidade LGPD | `analisadorGolpes.js`, `analiseControlador.js` | Conteúdo processado em memória, nunca persistido |
| RSNF-P01 | Tempo Resposta | `analisadorGolpes.js` | Motor heurístico determinístico (< 100ms) |
| RSNF-P02 | I/O Não Bloqueante | `server.js`, `app.js` | Node.js Event Loop, better-sqlite3 síncrono |
| RSNF-P03 | Pool Conexões | `conexaoBanco.js` | SQLite WAL mode, foreign_keys=ON |
| RSNF-R01 | WAL Mode | `conexaoBanco.js` | `PRAGMA journal_mode=WAL` |
| RSNF-R02 | Integridade Referencial | `conexaoBanco.js` | `PRAGMA foreign_keys=ON` |
| RSNF-R03 | Tratamento Erros | Todos os controladores | Try/catch, status codes apropriados |
| RSNF-R04 | Health Check | `app.js` | `GET /api/health` |
| RSNF-U01 | Acessibilidade | `index.html`, `estilo.css`, `app.js` | ARIA roles, font scaling, high contrast, focus outlines |
| RSNF-U02 | Reduced Motion | `estilo.css` | `@media (prefers-reduced-motion: reduce)` |
| RSNF-U03 | Responsividade | `index.html`, `estilo.css` | Viewport meta, flexbox, Tailwind CSS |
| RSNF-U04 | PWA | `manifest.webmanifest`, `service-worker.js` | Service Worker, cache-first assets |
| RSNF-A01 | Arquitetura MVC | `rotas/`, `controladores/`, `utilitarios/` | Separação de responsabilidades |
| RSNF-A02 | Separação Front/Backend | `frontend/`, `api/` | Comunicação via API REST JSON |
| RSNF-A03 | Modularização Frontend | `frontend/js/*.js` | Módulos ES6 (app, analise, alertas, guia, voz) |
| RSNF-A04 | Module System | `api/src/**/*.js`, `frontend/js/*.js` | CommonJS (backend), ES Modules (frontend) |

### 7.3 Matriz Rotas ↔ Frontend Modules

| Rota Backend | Método | Frontend Module | Função Frontend |
|--------------|--------|-----------------|-----------------|
| `POST /api/analises` | POST | `analise.js` | `api('POST', '/api/analises', dados)` |
| `GET /api/alertas` | GET | `alertas.js` | `api('GET', '/api/alertas')` |
| `POST /api/alertas` | POST | (formulário admin) | `api('POST', '/api/alertas', dados, true)` |
| `GET /api/guia` | GET | `guia.js` | `api('GET', '/api/guia')` |
| `GET /api/health` | GET | `app.js` | Verificação de disponibilidade |

---

**Fim do Documento — Requisitos de Sistema v1.0**
