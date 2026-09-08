# Plano de Execução — Héstia: Análise de Telefones e E-mails

## 1. Objetivo
Adicionar `telefone` e `email` ao motor heurístico do Héstia, com identificação estrutural, sinais de risco e explicações, mantendo análise local, determinística, rápida e sem armazenamento do conteúdo.

## 2. Limites
**Telefone:** DDD identifica área de numeração, não localização atual do titular. Portabilidade impede inferir a operadora atual pelo número.

**E-mail:** domínio pode indicar organização/provedor, mas não prova identidade. Provedores gratuitos não são suspeitos por si só.

## 3. Novos tipos
```js
tipo: "link" | "texto" | "pix" | "telefone" | "email"
```

## 4. Arquitetura
Preservar MVC: rota → controlador → validador → motor → resultado → metadados anônimos.

Estrutura inicial:
```text
api/src/utilitarios/analisadorGolpes.js
  analisarLink()
  analisarTexto()
  analisarPix()
  analisarTelefone()
  analisarEmail()
  classificarRisco()
  montarResumo()
```
Se crescer demais, separar posteriormente `analisadorTelefone.js`, `analisadorEmail.js` e módulos de regras.

## 5. Telefone
### 5.1 Normalização
Aceitar `(11) 99876-5432`, `11998765432`, `+55 11 99876-5432` e equivalentes. A máscara original não deve gerar risco.

### 5.2 País
Reconhecer `+55` como Brasil e números brasileiros sem código de país. Número estrangeiro não é automaticamente golpe.

### 5.3 DDD
Criar `api/src/config/codigosNacionais.js` com todos os códigos nacionais brasileiros, estados/regiões associados e, quando necessário, múltiplas UFs. Nunca inferir cidade ou localização atual a partir do DDD.

### 5.4 Tipo
Classificar como móvel, fixo, código não geográfico, internacional ou inválido/inconsistente.

### 5.5 Códigos não geográficos
Reconhecer ao menos `0300`, `0303`, `0500`, `0800` e `0900`. Eles fornecem contexto, não diagnóstico automático.

### 5.6 Estrutura
Detectar DDD inválido, quantidade impossível de dígitos, país/formato incompatível, sequências excessivamente repetitivas e caracteres inválidos. Esses sinais devem ter peso baixo/moderado.

### 5.7 Contexto
Regras independentes: `telefone_ddd_invalido`, `telefone_formato_invalido`, `telefone_numero_repetitivo`, `telefone_codigo_nao_geografico`, `telefone_contexto_urgente`, `telefone_contexto_pagamento`, `telefone_contexto_codigo_seguranca`, `telefone_contexto_premio`, `telefone_contexto_banco`.

## 6. E-mail
### 6.1 Sintaxe
Validar `@`, separação usuário/domínio, domínio, TLD, caracteres, comprimento e posições inválidas de pontos/hífens.

### 6.2 Domínio
Separar domínio e TLD e classificar como corporativo/institucional, gratuito, educacional, governamental, desconhecido ou potencialmente descartável. `gmail.com`, `outlook.com` etc. não são suspeitos por si só.

### 6.3 Impersonação
Criar base local de organizações relevantes, com domínios oficiais e termos associados. Diferenciar domínio oficial, semelhante, apenas mencionando a marca e desconhecido.

### 6.4 Profissionalismo operacionalizado
Analisar objetivamente a parte antes do `@`: sequências aleatórias muito longas, excesso de números, repetição, termos de prêmio/cobrança/urgência e termos institucionais incompatíveis com o domínio. Um endereço pessoal comum não deve ser punido apenas por ser pessoal.

### 6.5 Domínios descartáveis
Criar `api/src/config/dominiosEmail.js` com listas mantíveis de categorias. Ausência na lista nunca significa confiabilidade.

### 6.6 Homógrafos
Sinalizar caracteres não convencionais ou visualmente semelhantes usados para mascaramento, sem declarar automaticamente fraude.

## 7. Pontuação inicial
Manter `0–1 verde`, `2–3 amarelo`, `4+ vermelho`.

### Telefone
- DDD inválido +2
- formato inválido +2
- repetição excessiva +1
- código não geográfico 0
- internacional 0
- urgência +1
- pedido de código/senha +2
- pagamento +2
- prêmio +2
- representação de banco/governo +2

### E-mail
- sintaxe inválida +2
- domínio malformado +2
- descartável +2
- possível typosquatting +3
- possível homógrafo +3
- local-part muito aleatório +1
- linguagem de prêmio/cobrança +1
- marca oficial em domínio incompatível +3
- provedor gratuito 0

Os pesos são iniciais e serão calibrados por testes.

## 8. Resultado da API
Preservar os campos existentes e acrescentar `tipo` e `informacoes` quando aplicável.

Exemplo telefone:
```json
{
  "sucesso": true,
  "tipo": "telefone",
  "risco": "amarelo",
  "classificacao": "Atenção",
  "informacoes": {"pais":"Brasil","ddd":"11","estado":"SP","regiao":"Sudeste","tipo_numero":"movel"},
  "regras_atingidas": ["telefone_contexto_urgente"],
  "resumo": "O número pertence a uma área de numeração válida, mas o contexto apresenta sinais de urgência."
}
```

Exemplo e-mail:
```json
{
  "sucesso": true,
  "tipo": "email",
  "risco": "amarelo",
  "classificacao": "Atenção",
  "informacoes": {"dominio":"empresa-seguranca.com.br","categoria_dominio":"desconhecido"},
  "regras_atingidas": ["email_marca_em_dominio_incompativel"],
  "resumo": "O endereço utiliza termos associados a uma organização, mas o domínio não corresponde ao domínio oficial conhecido."
}
```

## 9. Validação
Atualizar `validadores.js` para aceitar os cinco tipos e criar validações específicas `validarTelefone()` e `validarEmail()`.

## 10. Banco e privacidade
Atualizar o `CHECK` de `estatisticas_analise` para aceitar `telefone` e `email`. Continuar armazenando somente tipo, risco, regras atingidas e timestamp. Nunca armazenar telefone, e-mail, domínio enviado ou conteúdo da mensagem.

## 11. Frontend
Adicionar opções `Telefone` e `E-mail`. Separar visualmente **informações identificadas** de **sinais de risco**.

## 12. Testes automatizados
A nova etapa também resolve a pendência já registrada de testes automatizados.

Criar:
```text
api/testes/
├── analisadorGolpes.test.js
├── telefone.test.js
├── email.test.js
└── validadores.test.js
```

Cobrir DDD, formatos, códigos não geográficos, contexto, sintaxe de e-mail, domínios, descartáveis, typosquatting, homógrafos, casos institucionais e regressão de link/texto/Pix.

## 13. Integração e privacidade
Testar `POST /api/analises` para os dois novos tipos, códigos HTTP, JSON, classificação, informações e ausência de persistência do conteúdo. Conferir também que telefone/e-mail não aparecem em logs.

## 14. Critérios de aceite
- [ ] telefone aceito
- [ ] e-mail aceito
- [ ] DDD identificado corretamente
- [ ] área de numeração apresentada sem alegar localização atual
- [ ] códigos não geográficos reconhecidos
- [ ] formatos comuns aceitos
- [ ] e-mails analisados sintaticamente
- [ ] domínios classificados
- [ ] provedores gratuitos não tratados como golpe por si só
- [ ] impersonação/typosquatting detectado
- [ ] caracteres suspeitos sinalizados
- [ ] sinais objetivos do local-part analisados
- [ ] contexto pode elevar risco
- [ ] semáforo preservado
- [ ] explicação dos sinais preservada
- [ ] conteúdo não persistido
- [ ] testes automatizados cobrindo novos módulos
- [ ] regressão de link/texto/Pix aprovada
- [ ] resposta continua muito abaixo de 3 segundos

## 15. Ordem de execução
```text
9.1 Modelagem e regras
↓
9.2 Base de DDDs e códigos
↓
9.3 Analisador de telefone
↓
9.4 Analisador de e-mail
↓
9.5 Validação + API
↓
9.6 Banco + privacidade
↓
9.7 Frontend
↓
9.8 Testes automatizados
↓
9.9 Integração + regressão
↓
9.10 Documentação
```

Cada fase deve ser validada antes da seguinte.

## 16. Modificações necessárias no plano anterior
Sim, esta etapa modifica o plano anterior porque altera o RF1, o contrato de `/api/analises`, o conjunto aceito por `validadores.js`, o `CHECK` de `estatisticas_analise`, a interface e o conjunto de testes.

RF1 passa de **Texto/Links/Pix** para **Texto/Links/Pix/Telefone/E-mail**.

A pendência de testes automatizados continua sendo tratada, agora incluindo os dois novos tipos.

O restante do plano permanece preservado.

## 17. Fora do escopo
Não adicionar nesta etapa APIs externas de telefone/e-mail, consulta de titular, geolocalização de pessoas, CPF, banco externo de dados pessoais, armazenamento de contatos ou modelo de IA externo. O Héstia continua sendo uma triagem heurística local.

## 18. Princípio técnico
A análise deve responder:

1. O que é este dado?
2. O que podemos identificar objetivamente?
3. Há sinais suficientes para recomendar cautela?

E não tentar responder quem é a pessoa, onde ela está exatamente ou se é definitivamente criminosa.
