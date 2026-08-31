# Héstia — Arquivo de Execução do Plano de Ação

> Documento operacional para prosseguir com a implementação do projeto **Héstia — Alerta Cidadão**, seguindo o plano de migração definido em `doc/plano_hestia_alerta_cidadao.md`.
>
> **Objetivo:** transformar a implementação planejada em uma sequência executável de tarefas, mantendo a arquitetura, os requisitos e as regras de privacidade definidos no projeto.
>
> **Fonte principal:** `doc/plano_hestia_alerta_cidadao.md`  
> **Referência estrutural:** `README.md`

---

## 0. Regras de execução

Antes de alterar qualquer arquivo, seguir estas regras:

- [ ] Manter a arquitetura MVC definida no projeto.
- [ ] Manter o backend em Node.js + Express + SQLite.
- [ ] Usar CommonJS no backend.
- [ ] Manter `better-sqlite3` para persistência.
- [ ] Não armazenar o conteúdo enviado para análise.
- [ ] Registrar somente metadados anônimos em `estatisticas_analise`.
- [ ] Manter Helmet, CORS, limite de payload e prepared statements.
- [ ] Manter o frontend como aplicação SPA-like servida pelo Express.
- [ ] Desenvolver a interface com prioridade mobile-first.
- [ ] Implementar acessibilidade cognitiva desde o início, e não como remendo final.
- [ ] Não adicionar serviços externos de análise de links ou mensagens ao motor heurístico.
- [ ] A triagem deve ser determinística e rápida.
- [ ] Não remover funcionalidades planejadas do Héstia para simplificar a implementação.
- [ ] Após cada fase, executar os testes correspondentes antes de avançar.

---

# 1. Estado inicial esperado

O projeto deverá evoluir para a seguinte estrutura:

```text
hestia/
├── api/
│   ├── db/
│   ├── src/
│   │   ├── config/
│   │   │   ├── conexaoBanco.js
│   │   │   └── listaGolpes.js
│   │   ├── controladores/
│   │   │   ├── analiseControlador.js
│   │   │   ├── alertaControlador.js
│   │   │   └── guiaControlador.js
│   │   ├── rotas/
│   │   │   ├── analiseRotas.js
│   │   │   ├── alertaRotas.js
│   │   │   └── guiaRotas.js
│   │   ├── utilitarios/
│   │   │   ├── analisadorGolpes.js
│   │   │   └── validadores.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   ├── .env.example
│   ├── iniciarBanco.js
│   └── package.json
│
├── frontend/
│   ├── assets/
│   │   └── icone.svg
│   ├── css/
│   │   └── estilo.css
│   ├── js/
│   │   ├── app.js
│   │   ├── analise.js
│   │   ├── alertas.js
│   │   ├── guia.js
│   │   └── voz.js
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   └── index.html
│
├── doc/
│   ├── projeto_integrador/
│   └── plano_hestia_alerta_cidadao.md
│
├── .gitignore
├── README.md
└── EXECUCAO_Hestia.md
```

---

# 2. Instalação e preparação

## 2.1. Pré-requisitos

Instalar:

- Node.js LTS atual, alvo definido pelo plano como Node.js 22.x.
- npm.
- Git.
- VS Code ou outro editor compatível.

No Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y nodejs npm git
```

Verificar:

```bash
node --version
npm --version
git --version
```

---

## 2.2. Preparar o backend

Entrar na pasta:

```bash
cd api
```

Inicializar dependências caso o `package.json` ainda não esteja configurado:

```bash
npm install
```

Dependências esperadas:

- `express`
- `better-sqlite3`
- `helmet`
- `cors`
- `validator`
- `dotenv`

Dependências de desenvolvimento podem incluir ferramenta para execução em desenvolvimento, conforme a configuração adotada no projeto.

---

## 2.3. Configurar ambiente

Criar `.env` a partir de `.env.example`.

Exemplo conceitual:

```env
PORT=3000
ORIGEM_PERMITIDA=http://localhost:3000
```

Não versionar o `.env`.

O `.env.example` deve permanecer no repositório.

---

# 3. Fase 1 — Banco de Dados

## Objetivo

Substituir a estrutura antiga de leads pelas tabelas necessárias ao Héstia.

### Tarefas

- [ ] Remover a tabela `leads`.
- [ ] Criar `alertas_golpes`.
- [ ] Criar `estatisticas_analise`.
- [ ] Criar índices de região e categoria.
- [ ] Configurar SQLite com WAL e foreign keys conforme arquitetura existente.
- [ ] Criar seeds iniciais para a Central de Alertas.
- [ ] Criar os dados iniciais necessários ao guia pós-golpe.
- [ ] Garantir que o conteúdo analisado nunca seja inserido no banco.

### Tabela `alertas_golpes`

Campos:

```text
id
titulo
descricao
regiao
categoria
nivel_risco
data_publicacao
```

`nivel_risco` deve aceitar apenas:

```text
verde
amarelo
vermelho
```

### Tabela `estatisticas_analise`

Campos:

```text
id
tipo_entrada
risco
regras_atingidas
criado_em
```

`tipo_entrada` deve aceitar apenas:

```text
link
texto
pix
```

### Teste da fase

Executar a inicialização:

```bash
node iniciarBanco.js
```

Verificar:

- [ ] Banco criado sem erro.
- [ ] Tabelas corretas existem.
- [ ] Índices criados.
- [ ] Seeds carregados.
- [ ] Nenhuma tabela `leads` permanece sendo utilizada.
- [ ] Nenhum conteúdo de análise é armazenado.

---

# 4. Fase 2 — Núcleo de Análise

## Objetivo

Criar o motor heurístico determinístico em:

```text
api/src/utilitarios/analisadorGolpes.js
```

A análise deve ocorrer localmente, sem chamadas externas.

## 4.1. Entradas

O motor deve aceitar:

```text
tipo: link
tipo: texto
tipo: pix
```

e o respectivo:

```text
conteudo
```

## 4.2. Regras para links

Implementar verificações para:

- [ ] Encurtadores conhecidos, como `bit.ly`, `tinyurl`, `t.ly` e `is.gd`.
- [ ] Uso de `http://` em vez de HTTPS.
- [ ] Extensões/domínios suspeitos.
- [ ] Números utilizados de maneira suspeita no domínio.
- [ ] Subdomínios ou domínios mascarados.
- [ ] Typosquatting de bancos e órgãos conhecidos.

Exemplos conceituais:

```text
banco-brasil.com
gov-br.com
paypal-seguro.com
```

## 4.3. Regras para textos

Verificar:

- [ ] Urgência.
- [ ] Prêmios.
- [ ] "Você ganhou".
- [ ] Confirmação/atualização de cadastro.
- [ ] Solicitação de CPF.
- [ ] Solicitação de senha.
- [ ] Solicitação de token.
- [ ] Solicitação de cartão.
- [ ] Pedidos de pagamento.
- [ ] Renda extra.
- [ ] Investimento garantido.
- [ ] Excesso de caixa alta.
- [ ] Excesso de pontuação.
- [ ] Número de telefone estranho.

## 4.4. Regras para Pix

Verificar:

- [ ] E-mail com domínio suspeito.
- [ ] Chave aleatória acompanhada de promessa de prêmio.
- [ ] Instruções fora do padrão.
- [ ] Contexto suspeito associado à chave.

Uma chave Pix válida, isoladamente, não deve ser tratada automaticamente como golpe.

## 4.5. Resultado

O motor deve produzir:

```js
{
  risco: "verde" | "amarelo" | "vermelho",
  regras_atingidas: [],
  resumo: ""
}
```

Classificação planejada:

```text
0–1 pontos  → verde
2–3 pontos  → amarelo
4+ pontos   → vermelho
```

### Testes manuais mínimos

- [ ] Texto normal → verde.
- [ ] Texto com sinais leves → amarelo.
- [ ] Texto com urgência + pedido de dados → amarelo/vermelho.
- [ ] Link encurtado → vermelho.
- [ ] Link HTTP suspeito → risco elevado.
- [ ] Domínio com typosquatting → risco elevado.
- [ ] Pix sem sinais suspeitos → verde/neutro.
- [ ] Pix com contexto de prêmio/instrução suspeita → risco elevado.

---

# 5. Fase 3 — API REST

## Objetivo

Conectar o motor, banco e frontend através da API.

## 5.1. Rotas

Implementar:

```text
POST /api/analises
GET  /api/alertas
POST /api/alertas
GET  /api/guia
GET  /api/health
```

## 5.2. Controladores

Criar:

```text
analiseControlador.js
alertaControlador.js
guiaControlador.js
```

Responsabilidades:

### `analiseControlador.js`

- Validar entrada.
- Executar o motor heurístico.
- Registrar somente metadados anônimos.
- Retornar o diagnóstico.

### `alertaControlador.js`

- Listar alertas.
- Filtrar por região.
- Filtrar por categoria.
- Permitir cadastro administrativo.

### `guiaControlador.js`

- Retornar o passo a passo pós-golpe.

---

# 6. Validação e segurança

Implementar/refatorar:

```text
api/src/utilitarios/validadores.js
```

## `validarAnalise(body)`

Regras:

- [ ] `tipo` obrigatório.
- [ ] `tipo` limitado a `link`, `texto` ou `pix`.
- [ ] `conteudo` obrigatório.
- [ ] Limite de aproximadamente 1000 caracteres.
- [ ] Sanitização/validação adequada.
- [ ] Conteúdo não persistido.

## `validarAlerta(body)`

Validar:

- [ ] título.
- [ ] descrição.
- [ ] região.
- [ ] categoria.
- [ ] nível de risco.

## Segurança

Manter:

- [ ] Helmet.
- [ ] CORS configurável via `.env`.
- [ ] Limite de payload de 10kb.
- [ ] Prepared statements.
- [ ] Respostas HTTP semânticas.
- [ ] Ausência de armazenamento do conteúdo sensível.

Códigos esperados:

```text
200
201
400
422
500
```

---

# 7. Fase 4 — Frontend básico

## Objetivo

Construir a primeira versão funcional da aplicação.

Arquivo principal:

```text
frontend/index.html
```

## Tela de Análise

Implementar:

- [ ] Campo para texto.
- [ ] Seleção de tipo: link, texto ou Pix.
- [ ] Botão de análise.
- [ ] Estado de carregamento.
- [ ] Resultado visual.
- [ ] Semáforo de risco.
- [ ] Lista de motivos.
- [ ] Resumo explicativo.
- [ ] Toast para mensagens de erro/sucesso.

O semáforo deve apresentar:

```text
🟢 Verde  → baixo risco
🟡 Amarelo → atenção
🔴 Vermelho → alto risco
```

Não utilizar somente a cor para transmitir o resultado. O símbolo e o texto devem acompanhar o indicador.

---

# 8. Fase 5 — Central de Alertas

Arquivo:

```text
frontend/js/alertas.js
```

Implementar:

- [ ] Busca em `GET /api/alertas`.
- [ ] Cards de alertas.
- [ ] Exibição da categoria.
- [ ] Exibição da região.
- [ ] Exibição do nível de risco.
- [ ] Filtro por região.
- [ ] Filtro por categoria.
- [ ] Estado vazio.
- [ ] Tratamento de erro da API.

A Central deve representar os golpes mais comuns da semana por região.

---

# 9. Fase 5 — Guia Pós-Golpe

Arquivo:

```text
frontend/js/guia.js
```

Implementar fluxo:

```text
Você foi vítima?
        ↓
Acionar banco
        ↓
Solicitar MED quando aplicável
        ↓
Gerar B.O.
        ↓
Trocar senhas
        ↓
Concluir checklist
```

Características:

- [ ] Passos claros.
- [ ] Linguagem simples.
- [ ] Checklist interativo.
- [ ] Feedback visual de conclusão.
- [ ] Compatibilidade com leitura em voz.
- [ ] Sem linguagem culpabilizante.

---

# 10. Seção Sobre / Empatia

Adicionar uma seção explicando:

- O que é o Héstia.
- Para que serve.
- Como funciona a análise.
- Que a análise é heurística e não constitui garantia de que algo é seguro.
- Que o conteúdo analisado não é armazenado.
- Como o sistema atende diferentes perfis de usuários.

A linguagem deve ser simples, acolhedora e sem julgamento.

---

# 11. Fase 6 — Acessibilidade

## Objetivo

Implementar integralmente o RNF1.

Arquivo:

```text
frontend/js/voz.js
```

## Interface

- [ ] Fonte base mínima de aproximadamente 18px.
- [ ] Controle A−.
- [ ] Controle A+.
- [ ] Escala de fonte de até 125%.
- [ ] Alto contraste.
- [ ] Foco visível.
- [ ] Navegação completa por teclado.
- [ ] HTML semântico.
- [ ] `aria-live` nos resultados.
- [ ] Respeitar `prefers-reduced-motion`.

## Voz

Implementar:

```text
SpeechRecognition
speechSynthesis
```

### Entrada

Permitir que o usuário dite o conteúdo da análise quando o navegador suportar a API.

### Saída

Permitir leitura em voz alta:

- classificação;
- resumo;
- motivos encontrados;
- passos do guia.

### Fallback

Quando a API de voz não estiver disponível:

- [ ] Manter a digitação normalmente.
- [ ] Não bloquear a aplicação.
- [ ] Exibir aviso amigável sobre a indisponibilidade.

---

# 12. Fase 7 — PWA

Criar:

```text
frontend/manifest.webmanifest
frontend/service-worker.js
```

Implementar:

- [ ] Nome do aplicativo.
- [ ] Ícone.
- [ ] `start_url`.
- [ ] `display` adequado para aplicativo.
- [ ] Metadados necessários.
- [ ] Cache dos recursos estáticos.
- [ ] Funcionamento offline da interface quando possível.

## Regra importante

O Service Worker **não deve cachear requisições da API**.

A análise deve continuar sendo uma operação dinâmica.

---

# 13. Integração Express + Frontend

O Express deve:

1. inicializar middlewares;
2. configurar segurança;
3. registrar as rotas da API;
4. servir os arquivos do frontend;
5. responder ao health check.

A aplicação deverá estar acessível em:

```text
http://localhost:3000/
```

Health check:

```text
http://localhost:3000/api/health
```

---

# 14. Fase 8 — Limpeza do projeto antigo

Remover ou descontinuar completamente:

- [ ] Tabela `leads`.
- [ ] Endpoint `/api/leads`.
- [ ] Controladores de leads.
- [ ] Rotas de leads.
- [ ] Formulário antigo de captura.
- [ ] Hero de negócio genérico.
- [ ] Texto relacionado a "MinhaMarca".
- [ ] Código que não tenha função no Héstia.

Não remover documentação acadêmica necessária ao projeto.

---

# 15. Teste de integração

## Backend

Executar:

```bash
npm run dev
```

Verificar:

```text
GET /api/health
POST /api/analises
GET /api/alertas
GET /api/guia
```

## Análise

Caso de teste:

```json
{
  "tipo": "texto",
  "conteudo": "URGENTE! Você ganhou um prêmio. Confirme seus dados."
}
```

Verificar:

- [ ] Resposta bem formada.
- [ ] Risco coerente.
- [ ] Regras atingidas presentes.
- [ ] Resumo explicativo.
- [ ] Conteúdo original não armazenado.

---

# 16. Teste de privacidade

Após realizar análises:

- [ ] Inspecionar `estatisticas_analise`.
- [ ] Confirmar que somente metadados foram armazenados.
- [ ] Confirmar que o texto original não aparece.
- [ ] Confirmar que links não aparecem.
- [ ] Confirmar que chaves Pix não aparecem.
- [ ] Confirmar que dados pessoais não aparecem.

A existência de estatísticas não pode significar armazenamento indireto do conteúdo analisado.

---

# 17. Teste de desempenho

O requisito RNF2 determina:

```text
triagem ≤ 3 segundos
```

Medir a operação no navegador.

Como o motor é local e determinístico, evitar:

- chamadas externas desnecessárias;
- processamento pesado;
- dependências que atrasem a análise;
- consultas ao banco contendo o conteúdo original.

Critério:

- [ ] Análise completa em até 3 segundos em condições normais.

---

# 18. Teste de acessibilidade

Verificar manualmente:

- [ ] Navegação apenas pelo teclado.
- [ ] Foco visível.
- [ ] Textos legíveis.
- [ ] Contraste adequado.
- [ ] Resultado compreensível sem depender da cor.
- [ ] Leitura por voz.
- [ ] Entrada por voz quando suportada.
- [ ] Interface utilizável com fonte ampliada.
- [ ] `aria-live` funcionando para resultados.
- [ ] Animações reduzidas quando `prefers-reduced-motion` estiver ativo.

---

# 19. Teste PWA

Verificar:

- [ ] Manifest carregado.
- [ ] Ícone reconhecido.
- [ ] Aplicação instalável.
- [ ] Service Worker registrado.
- [ ] Recursos estáticos disponíveis offline.
- [ ] API não armazenada em cache pelo Service Worker.

---

# 20. Critérios finais de aceite

O projeto só deve ser considerado concluído quando todos os itens abaixo estiverem funcionando:

- [ ] `POST /api/analises` realiza a triagem.
- [ ] Links, textos e Pix podem ser analisados.
- [ ] O semáforo apresenta verde, amarelo ou vermelho.
- [ ] Os motivos do diagnóstico são exibidos.
- [ ] A resposta ocorre em até 3 segundos.
- [ ] A Central de Alertas funciona.
- [ ] Os filtros por região/categoria funcionam.
- [ ] O Guia Pós-Golpe funciona.
- [ ] O checklist funciona.
- [ ] A leitura em voz funciona quando suportada.
- [ ] O fallback de voz funciona.
- [ ] O controle de tamanho de fonte funciona.
- [ ] O alto contraste funciona.
- [ ] A navegação por teclado funciona.
- [ ] A aplicação é instalável como PWA.
- [ ] O Service Worker não cacheia a API.
- [ ] O conteúdo analisado não é persistido.
- [ ] As métricas anônimas são registradas corretamente.
- [ ] Helmet está ativo.
- [ ] CORS está configurado.
- [ ] O limite de payload está ativo.
- [ ] Prepared statements são utilizados.
- [ ] O health check funciona.
- [ ] O código antigo de leads foi removido.
- [ ] A estrutura de pastas segue a arquitetura definida.
- [ ] O README foi atualizado após a implementação.

---

# 21. Ordem obrigatória de execução

Não implementar tudo simultaneamente. Seguir esta ordem:

```text
FASE 1
Banco
  ↓
FASE 2
Motor heurístico
  ↓
FASE 3
API + validação
  ↓
FASE 4
Frontend de análise
  ↓
FASE 5
Alertas + Guia
  ↓
FASE 6
Acessibilidade + Voz
  ↓
FASE 7
PWA + desempenho
  ↓
FASE 8
Limpeza + documentação
  ↓
TESTES FINAIS
```

Cada fase deve ser validada antes da seguinte.

---

# 22. Comando final de execução

Depois de concluída a implementação:

```bash
cd api
npm install
npm run dev
```

Abrir:

```text
http://localhost:3000/
```

Health check:

```text
http://localhost:3000/api/health
```

---

# 23. Definição de pronto

A implementação está **PRONTA** quando:

1. O servidor inicia sem erros.
2. O banco é criado automaticamente.
3. Todas as rotas previstas respondem corretamente.
4. O usuário consegue analisar link, texto e Pix.
5. O resultado aparece visualmente através do Semáforo de Risco.
6. A Central de Alertas funciona.
7. O Guia Pós-Golpe funciona.
8. A acessibilidade planejada funciona.
9. O PWA pode ser instalado.
10. O conteúdo sensível analisado não é persistido.
11. Os testes de integração e privacidade foram realizados.
12. A documentação corresponde à implementação final.

> **Princípio central:** o Héstia deve ajudar o usuário a tomar uma decisão mais informada sem fingir possuir certeza absoluta. O motor identifica sinais de risco, não "prova" que uma mensagem é golpe.

---

## Referências do projeto

- `README.md` — arquitetura, tecnologias, endpoints e regras existentes.
- `doc/plano_hestia_alerta_cidadao.md` — plano de migração e sequência oficial das fases.

