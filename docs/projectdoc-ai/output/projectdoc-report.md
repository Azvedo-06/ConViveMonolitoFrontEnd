# Documentacao Tecnica - convive-web

Gerado automaticamente em: 2026-05-28T23:55:38.995Z

## Resumo Executivo

convive-web e um front-end SPA orientado a comunidade local, com foco em descoberta e divulgacao de eventos por cidade.
Stack principal detectada: react, vite, typescript, tailwind, postcss.
A organizacao atual privilegia separacao por feature e camada de servicos, favorecendo evolucao incremental.

## Visao Geral do Sistema

- Objetivo: conectar publico local e organizadores em uma vitrine hiper-local de eventos, cursos e atividades.
- Escopo atual: onboarding por cidade, feed filtravel, telas de login/cadastro e base de integracao com API.
- Status funcional: experiencia de navegacao pronta no front-end, com integracoes criticas ainda pendentes.

## Tecnologias Utilizadas

- react
- vite
- typescript
- tailwind
- postcss

## Arquitetura e Organizacao

Front-end SPA em React com organizacao por feature, separando composicao de telas, regras de apresentacao e integracao HTTP.

Camadas identificadas:
- Camada de features (UI e fluxos por dominio)
- Camada de servicos (integracao HTTP e rotas de backend)
- Camada de tema/estilo (identidade visual por cidade)
- Camada de bootstrap (entrada da aplicacao e composicao principal)

Estrutura do projeto (amostra):
- .github (1 arquivo(s) mapeado(s))
  - .github/prompts/projectdoc-ai.prompt.md
- docs (4 arquivo(s) mapeado(s))
  - docs/projectdoc-ai/DECISOES-IMPLEMENTACAO.md
  - docs/projectdoc-ai/output/projectdoc-relatorio-executivo.md
  - docs/projectdoc-ai/output/projectdoc-report.md
  - docs/projectdoc-ai/USO.md
- package-lock.json (1 arquivo(s) mapeado(s))
  - package-lock.json
- package.json (1 arquivo(s) mapeado(s))
  - package.json
- postcss.config.js (1 arquivo(s) mapeado(s))
  - postcss.config.js
- src (12 arquivo(s) mapeado(s))
  - src/App.tsx
  - src/features/auth/LoginScreen.tsx
  - src/features/auth/SignupScreen.tsx
  - src/features/city/cityFeedData.ts
  - src/features/city/cityFeedUtils.ts
  - src/features/city/CityLandingScreen.tsx
- tailwind.config.ts (1 arquivo(s) mapeado(s))
  - tailwind.config.ts
- tsconfig.json (1 arquivo(s) mapeado(s))
  - tsconfig.json
- vite.config.ts (1 arquivo(s) mapeado(s))
  - vite.config.ts

## Regras de Negocio Identificadas

1. [Explicita] A navegacao principal exige selecao de cidade antes de liberar login, cadastro e feed local. (evidencia: src/App.tsx)
2. [Explicita] Conteudos do feed sao filtrados por cidade e categoria antes da busca textual. (evidencia: src/features/city/cityFeedUtils.ts)
3. [Explicita] Itens pagos mostram preco/estado pago; itens gratuitos recebem destaque como gratuitos. (evidencia: src/features/city/CityLandingScreen.tsx)
4. [Explicita] Conta de organizador comunica regra comercial de taxa de 10% para venda de ingressos. (evidencia: src/features/auth/SignupScreen.tsx)
5. [Explicita] Falhas de backend priorizam mensagem estruturada da API e fallback para texto bruto. (evidencia: src/services/backendRoutes.ts)
6. [Inferida] O produto opera com segmentacao hiper-local por cidade (cidades ativas detectadas: campo-mourao, mambore). (evidencia: src/features/city/cityFeedData.ts)
7. [Inferida] O modelo mistura conteudo gratuito e monetizado (gratuitos: 9, pagos: 3), sugerindo estrategia de engajamento + receita. (evidencia: src/features/city/cityFeedData.ts)

## Boas Praticas Observadas

- Pipeline de build valida tipagem TypeScript antes da geracao final com Vite.
- TypeScript em modo strict, reduzindo riscos de erro em tempo de execucao.
- Uso de React.StrictMode para detectar problemas de ciclo de vida e efeitos colaterais no desenvolvimento.
- Busca textual normalizada (trim + lowercase), melhorando consistencia de filtro para o usuario.
- Fluxo de navegacao encapsulado em handlers nomeados, facilitando manutencao e leitura.

## Pontos de Atencao e Riscos Tecnicos

1. (Alta) Cadastro ainda sem integracao real de backend (TODO no fluxo de criacao de conta). Impacto: Risco funcional: fluxo de negocio incompleto para producao. Evidencia: src/App.tsx.
2. (Alta) Tela de login nao autentica de fato; formulario apenas previne submit. Impacto: Risco de falso positivo de prontidao funcional. Evidencia: src/features/auth/LoginScreen.tsx.
3. (Media) Fluxos de cadastro existem no front-end, porem sem validacoes robustas e sem chamada obrigatoria a API. Impacto: Risco de inconsistencias cadastrais e divergencia com regras do backend. Evidencia: src/features/auth/SignupScreen.tsx.
4. (Media) Nao foram identificados testes automatizados (unitarios/integracao/e2e). Impacto: Aumenta risco de regressao em evolucoes de fluxo e regras de negocio. Evidencia: Estrutura do repositorio.

## Lacunas de Documentacao e Inconsistencias

- Nao foram encontrados artefatos formais de arquitetura (ADR, diagramas, wiki tecnica ou README detalhado de dominio).
- Regras comerciais aparecem em texto de interface, mas sem fonte unica versionada de regras de negocio.
- Contratos de API ainda nao estao documentados no repositorio (ex.: OpenAPI/Swagger local).
- Nao ha politica explicita de testes e criterios de qualidade por camada.

## Sugestao de Diagramas C4 (Base Textual)

### Contexto
- Sistema: convive-web (plataforma web para descoberta/divulgacao de eventos locais).
- Pessoa: Publico local (busca eventos, cursos e atividades por cidade).
- Pessoa: Organizador (publica eventos e acompanha reservas/ingressos).
- Sistema Externo: Backend ConVive API (autenticacao, usuarios, administracao e dados de eventos).
- Relacoes:
- Publico local -> ConVive Web: consulta feed, busca e visualiza detalhes.
- Organizador -> ConVive Web: cadastra conta e gerencia conteudo/eventos.
- ConVive Web -> ConVive API: autentica, cria usuarios e obtem recursos protegidos.

### Containers
- Container 1: Web App React (Vite) - UI, roteamento de fluxo e filtros locais.
- Container 2: Theme Engine - variaveis CSS e troca de tema por cidade.
- Container 3: Service Layer - wrapper backendFetch + backendRoutes.
- Container 4: ConVive API (externo) - regras de autenticacao, usuarios e dominio.
- Relacoes:
- Web App React usa Theme Engine para identidade visual por cidade.
- Web App React usa Service Layer para comunicacao HTTP padronizada.
- Service Layer consome ConVive API via REST/JSON.

### Componentes
- Componente: App (orquestracao de estados de tela e cidade selecionada).
- Componente: CityOnboardingScreen (entrada de cidade e aplicacao de tema).
- Componente: CityLandingScreen (feed, filtros, busca e detalhes de item).
- Componente: LoginScreen e SignupScreen (acesso e cadastro segmentado).
- Componente: cityFeedData + cityFeedUtils (dados locais e logica de filtro).
- Componente: backendRoutes + backendFetch (contrato de endpoints e cliente HTTP).

### Codigo (quando aplicavel)
- Fluxo de codigo recomendado para detalhamento:
- 1) App.handleCitySelected -> applyCityTheme -> estado global de cidade.
- 2) CityLandingScreen -> filterCityFeed -> renderizacao dos cards filtrados.
- 3) Submit de Login/Cadastro -> Service Layer -> backendFetch -> API.
- 4) Tratamento de erro backendFetch -> exibicao de feedback na UI.

## Recomendacoes Tecnicas Objetivas

1. Integrar LoginScreen/SignupScreen ao backendFetch com validacao de formulario e tratamento de erro padronizado.
2. Criar testes unitarios para cityFeedUtils e testes de integracao para fluxos de onboarding/login/cadastro.
3. Extrair regras comerciais (gratuito/pago, taxa, limites de vagas) para modulo de dominio centralizado.
4. Formalizar documentacao de API e contratos de dados para reduzir divergencia front-back.
5. Introduzir observabilidade minima (telemetria de erros e eventos de conversao por fluxo).

## Conclusao Tecnica

O projeto demonstra boa base estrutural para evolucao, especialmente em separacao por features e padronizacao visual por cidade.
Para uso academico e maturidade de engenharia, o principal gap e transformar fluxos atualmente demonstrativos em fluxos transacionais reais com testes e documentacao de arquitetura continuamente atualizada.
