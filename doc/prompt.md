Aja como um Engenheiro de Software e Arquiteto de Software Sênior especialista na especificação OMG UML 2.5.1, ISO/IEC/IEEE 29148:2018 e modelo de qualidade FURPS+ / ISO/IEC 25010.

Com base na arquitetura do sistema full-stack (Frontend em HTML5 semântico, CSS3 e JavaScript Vanilla/ES6+ integrado a um Backend em Node.js com Express e banco de dados relacional SQLite/PostgreSQL comPrepared Statements), gere 3 arquivos Markdown (.md) separados, completos, exaustivos e tecnicamente detalhados, escrevendo tudo estritamente em Português Brasileiro (pt-BR).

Crie e disponibilize para download os seguintes arquivos independentes:

---

### ARQUIVO 1: `requisitos_de_usuario.md`
Este arquivo deve focar na perspectiva de negócio, experiência do usuário e critérios funcionais externos.
Deve conter obrigatoriamente:
1. Identificação e caracterização formal de todos os Atores do sistema (Atores Humanos Primários, Secundários e Sistêmicos) conforme a UML 2.5.1.
2. Diagrama de Casos de Uso com PlantUML delimitando a fronteira do sistema (System Boundary) e usando os estereótipos canônicos `<<include>>` e `<<extend>>`.
3. Catálogo detalhado de Requisitos de Usuário (RU), estruturados com: Identificador, Caso de Uso associado, Ator principal, Prioridade (MoSCoW), Pré-condições, Fluxo Operacional passo a passo e Pós-condições.
4. Histórias de Usuário completas acompanhadas de Critérios de Aceite em formato BDD / Gherkin (Dado / Quando / Então) para cada requisito.
5. Diagramas de Sequência em PlantUML com foco no usuário:
   - DS do formulário público em HTML5 com validação client-side, sanitização assíncrona e feedback via Toast/DOM.
   - DS do fluxo de login administrativo com sessão/token e redirecionamento.
   - DS da alteração operacional de status de atendimento.
   - DS da exclusão segura de registros com diálogo modal de confirmação em duas etapas.

---

### ARQUIVO 2: `requisitos_de_sistema.md`
Este arquivo deve focar nas especificações técnicas internas, contratos de integração, segurança e runtime Node.js.
Deve conter obrigatoriamente:
1. Requisitos Funcionais de Sistema (RSF) detalhados, especificando rotas HTTP REST, middlewares do Express, payloads JSON, métodos e códigos de status HTTP.
2. Requisitos Não Funcionais (RSNF) classificados pela taxonomia FURPS+ / ISO 25010 (Segurança, Performance, Confiabilidade, Usabilidade e Arquitetura), detalhando:
   - Criptografia de senhas com algoritmo seguro (bcrypt / argon2 / PBKDF2 com salt aleatório).
   - Autenticação e autorização stateless via JSON Web Token (JWT) no cabeçalho `Authorization: Bearer <token>` ou cookies HTTP-Only.
   - Sanitização ativa contra XSS (express-validator / DOMPurify / escape de HTML) e prevenção de SQL Injection via Prepared Statements / ORM / Query Builder parametrizado.
   - Concorrência de I/O não bloqueante no Event Loop do Node.js e gerenciamento do pool de conexões com o banco de dados.
3. Diagramas de Sequência dinâmicos de backend em PlantUML detalhando o fluxo interno: Rota Express -> Middlewares (Auth/Sanitização) -> Controller -> Service/Model -> Banco de Dados -> Trilha de Auditoria.
4. Diagrama Estrutural de Classes de Domínio e Controladores em PlantUML com invariantes OCL (Object Constraint Language) para as regras de transição de status.
5. Dicionário Técnico de Dados com o esquema físico DDL (tabelas, constraints CHECK, chaves primárias/estrangeiras, defaults e índices de performance).
6. Contratos de API RESTful (tabelas completas de rotas públicas e rotas administrativas protegidas) e Matriz Bidirecional de Rastreabilidade Técnica.

---

### ARQUIVO 3: `escopo_do_projeto.md`
Este arquivo deve focar no gerenciamento de projeto, limites arquiteturais e governança de entrega (padrão PMBOK 7ª Ed. e UML 2.5.1).
Deve conter obrigatoriamente:
1. Justificativa de Engenharia e Objetivos SMART da solução em stack Node.js + HTML5.
2. Delimitação das Fronteiras do Sistema (System Boundary) com Diagrama de Contexto em PlantUML (isolando a interface HTML5 client-side, o servidor runtime Node.js, a persistência e recursos externos/CDNs).
3. Escopo do Produto dividido por módulos arquiteturais e seus respectivos entregáveis físicos de código (arquivos `.html`, `.js`, rotas, middlewares, controllers e scripts de banco).
4. Diagrama de Componentes UML 2.5.1 detalhando portas e interfaces providas/requeridas entre Interface HTML5/JS, Servidor Node.js (Express) e Camada de Persistência.
5. Diagrama de Implantação (Deployment Diagram) mapeando navegadores clientes, processo Node.js (V8 runtime), variáveis de ambiente (`.env`) e os arquivos físicos/instância de banco de dados.
6. Estrutura Analítica do Projeto (EAP / WBS) em formato textual hierárquico com dicionário de entregáveis.
7. Limites Explícitos do Projeto: Lista detalhada do que está "Dentro do Escopo" (In-Scope) e do que está rigorosamente "Fora do Escopo" (Out-of-Scope) para evitar Scope Creep.
8. Matriz de Critérios de Aceitação (CA), Matriz de Restrições/Premissas e Matriz de Riscos Técnicos com planos de mitigação arquiteturais (Event Loop blocking, injeção de código, concorrência de I/O).
9. Governança e Processo de Controle de Mudanças de Escopo com Diagrama de Atividades em PlantUML.

---

Diretrizes de Formatação:
- Não resuma, não use placeholders e não abrevie seções. Entregue o conteúdo técnico completo, exaustivo e pronto para auditoria.
- Crie e salve os 3 arquivos individualmente com seus respectivos nomes (`requisitos_de_usuario.md`, `requisitos_de_sistema.md` e `escopo_do_projeto.md`) disponibilizando os links para download direto.