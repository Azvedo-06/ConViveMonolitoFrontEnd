#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg
  ? path.resolve(cwd, outputArg.split('=')[1])
  : path.resolve(cwd, 'docs/projectdoc-ai/output/projectdoc-report.md');

const MAX_FILE_SIZE_BYTES = 180_000;
const MAX_FILE_SAMPLES = 220;

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.vscode',
]);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.yml', '.yaml']);

const PROJECT_HINTS = {
  react: ['react', '@vitejs/plugin-react'],
  vite: ['vite'],
  typescript: ['typescript'],
  tailwind: ['tailwindcss'],
};

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function walkDirectory(baseDir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }
        walk(path.join(currentDir, entry.name));
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      const rel = toPosix(path.relative(baseDir, fullPath));
      const ext = path.extname(entry.name).toLowerCase();
      if (SOURCE_EXTENSIONS.has(ext) || entry.name === 'package.json') {
        files.push({ fullPath, rel, ext });
      }
    }
  }

  walk(baseDir);
  return files;
}

function readSamples(files) {
  const samples = [];
  for (const file of files.slice(0, MAX_FILE_SAMPLES)) {
    const stat = fs.statSync(file.fullPath);
    if (stat.size > MAX_FILE_SIZE_BYTES) {
      continue;
    }
    let content = '';
    try {
      content = fs.readFileSync(file.fullPath, 'utf8');
    } catch {
      continue;
    }

    samples.push({ ...file, content });
  }
  return samples;
}

function detectTechnologies(packageJson, rootFiles) {
  const deps = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };

  const stack = [];
  for (const [tech, keys] of Object.entries(PROJECT_HINTS)) {
    if (keys.some((key) => key in deps)) {
      stack.push(tech);
    }
  }

  if (rootFiles.some((f) => f.rel === 'postcss.config.js')) {
    stack.push('postcss');
  }

  return Array.from(new Set(stack));
}

function identifyLayers(files) {
  const rels = files.map((f) => f.rel);
  const hasFeatures = rels.some((p) => p.startsWith('src/features/'));
  const hasServices = rels.some((p) => p.startsWith('src/services/'));
  const hasTheme = rels.some((p) => p.startsWith('src/theme/'));
  const hasStyles = rels.some((p) => p.startsWith('src/styles/'));

  const layers = [];
  if (hasFeatures) layers.push('Camada de features (UI e fluxos por dominio)');
  if (hasServices) layers.push('Camada de servicos (integracao HTTP e rotas de backend)');
  if (hasTheme || hasStyles) layers.push('Camada de tema/estilo (identidade visual por cidade)');
  layers.push('Camada de bootstrap (entrada da aplicacao e composicao principal)');

  return layers;
}

function findByRel(samples, relPath) {
  return samples.find((sample) => sample.rel === relPath)?.content ?? '';
}

function extractBusinessRules(samples) {
  const rules = [];
  const app = findByRel(samples, 'src/App.tsx');
  const feedData = findByRel(samples, 'src/features/city/cityFeedData.ts');
  const feedUtils = findByRel(samples, 'src/features/city/cityFeedUtils.ts');
  const landing = findByRel(samples, 'src/features/city/CityLandingScreen.tsx');
  const signup = findByRel(samples, 'src/features/auth/SignupScreen.tsx');
  const backend = findByRel(samples, 'src/services/backendRoutes.ts');

  if (app.includes('if (!selectedCity)')) {
    rules.push({
      type: 'Explicita',
      rule: 'A navegacao principal exige selecao de cidade antes de liberar login, cadastro e feed local.',
      evidence: 'src/App.tsx',
    });
  }

  if (feedUtils.includes('item.city === city && item.category === category')) {
    rules.push({
      type: 'Explicita',
      rule: 'Conteudos do feed sao filtrados por cidade e categoria antes da busca textual.',
      evidence: 'src/features/city/cityFeedUtils.ts',
    });
  }

  if (landing.includes("item.access === 'pago' ? (item.ticketPrice ?? 'Pago') : 'Gratuito'")) {
    rules.push({
      type: 'Explicita',
      rule: 'Itens pagos mostram preco/estado pago; itens gratuitos recebem destaque como gratuitos.',
      evidence: 'src/features/city/CityLandingScreen.tsx',
    });
  }

  if (signup.includes('taxa de 10%')) {
    rules.push({
      type: 'Explicita',
      rule: 'Conta de organizador comunica regra comercial de taxa de 10% para venda de ingressos.',
      evidence: 'src/features/auth/SignupScreen.tsx',
    });
  }

  if (backend.includes("errorPayload.message || errorPayload.error || errorMessage")) {
    rules.push({
      type: 'Explicita',
      rule: 'Falhas de backend priorizam mensagem estruturada da API e fallback para texto bruto.',
      evidence: 'src/services/backendRoutes.ts',
    });
  }

  const cityIds = Array.from(feedData.matchAll(/city:\s*'([^']+)'/g)).map((m) => m[1]);
  const uniqueCities = Array.from(new Set(cityIds));
  if (uniqueCities.length > 0) {
    rules.push({
      type: 'Inferida',
      rule: `O produto opera com segmentacao hiper-local por cidade (cidades ativas detectadas: ${uniqueCities.join(', ')}).`,
      evidence: 'src/features/city/cityFeedData.ts',
    });
  }

  const paidItems = (feedData.match(/access:\s*'pago'/g) ?? []).length;
  const freeItems = (feedData.match(/access:\s*'gratuito'/g) ?? []).length;
  if (paidItems + freeItems > 0) {
    rules.push({
      type: 'Inferida',
      rule: `O modelo mistura conteudo gratuito e monetizado (gratuitos: ${freeItems}, pagos: ${paidItems}), sugerindo estrategia de engajamento + receita.`,
      evidence: 'src/features/city/cityFeedData.ts',
    });
  }

  return rules;
}

function detectGoodPractices(samples, packageJson) {
  const practices = [];
  const app = findByRel(samples, 'src/App.tsx');
  const tsconfig = findByRel(samples, 'tsconfig.json');
  const main = findByRel(samples, 'src/main.tsx');
  const feedUtils = findByRel(samples, 'src/features/city/cityFeedUtils.ts');

  if (packageJson?.scripts?.build?.includes('tsc -b')) {
    practices.push('Pipeline de build valida tipagem TypeScript antes da geracao final com Vite.');
  }

  if (tsconfig.includes('"strict": true')) {
    practices.push('TypeScript em modo strict, reduzindo riscos de erro em tempo de execucao.');
  }

  if (main.includes('<React.StrictMode>')) {
    practices.push('Uso de React.StrictMode para detectar problemas de ciclo de vida e efeitos colaterais no desenvolvimento.');
  }

  if (feedUtils.includes('normalizedSearch')) {
    practices.push('Busca textual normalizada (trim + lowercase), melhorando consistencia de filtro para o usuario.');
  }

  if (app.includes('handle') && app.includes('setCurrentScreen')) {
    practices.push('Fluxo de navegacao encapsulado em handlers nomeados, facilitando manutencao e leitura.');
  }

  return practices;
}

function detectRisks(samples) {
  const risks = [];
  const app = findByRel(samples, 'src/App.tsx');
  const login = findByRel(samples, 'src/features/auth/LoginScreen.tsx');
  const signup = findByRel(samples, 'src/features/auth/SignupScreen.tsx');
  const backend = findByRel(samples, 'src/services/backendRoutes.ts');
  const allContent = samples.map((s) => s.content).join('\n');

  if (app.includes('TODO: Call backend')) {
    risks.push({
      severity: 'Alta',
      item: 'Cadastro ainda sem integracao real de backend (TODO no fluxo de criacao de conta).',
      impact: 'Risco funcional: fluxo de negocio incompleto para producao.',
      evidence: 'src/App.tsx',
    });
  }

  if (login.includes('onSubmit={(event) => event.preventDefault()}')) {
    risks.push({
      severity: 'Alta',
      item: 'Tela de login nao autentica de fato; formulario apenas previne submit.',
      impact: 'Risco de falso positivo de prontidao funcional.',
      evidence: 'src/features/auth/LoginScreen.tsx',
    });
  }

  if (signup.includes('onSubmit={(event) => event.preventDefault()}')) {
    risks.push({
      severity: 'Media',
      item: 'Fluxos de cadastro existem no front-end, porem sem validacoes robustas e sem chamada obrigatoria a API.',
      impact: 'Risco de inconsistencias cadastrais e divergencia com regras do backend.',
      evidence: 'src/features/auth/SignupScreen.tsx',
    });
  }

  if (!allContent.includes('try {') && backend.includes('throw new Error(errorMessage)')) {
    risks.push({
      severity: 'Media',
      item: 'Nao ha camada dedicada para tratamento global de erros de requisicao na UI.',
      impact: 'Mensagens de erro podem ficar sem padrao para o usuario final.',
      evidence: 'src/services/backendRoutes.ts',
    });
  }

  const hasTests = samples.some((s) => /\.test\.|\.spec\./.test(s.rel));
  if (!hasTests) {
    risks.push({
      severity: 'Media',
      item: 'Nao foram identificados testes automatizados (unitarios/integracao/e2e).',
      impact: 'Aumenta risco de regressao em evolucoes de fluxo e regras de negocio.',
      evidence: 'Estrutura do repositorio',
    });
  }

  return risks;
}

function groupProjectStructure(files) {
  const groups = new Map();
  for (const file of files) {
    const parts = file.rel.split('/');
    const top = parts[0] ?? 'root';
    if (!groups.has(top)) {
      groups.set(top, []);
    }
    groups.get(top).push(file.rel);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([group, items]) => ({
      group,
      count: items.length,
      examples: items.slice(0, 6),
    }));
}

function inferArchitecture(technologies, files) {
  const hasFeatureFolders = files.some((f) => f.rel.startsWith('src/features/'));
  const hasServiceFolder = files.some((f) => f.rel.startsWith('src/services/'));

  if (technologies.includes('react') && hasFeatureFolders && hasServiceFolder) {
    return 'Front-end SPA em React com organizacao por feature, separando composicao de telas, regras de apresentacao e integracao HTTP.';
  }

  if (technologies.includes('react')) {
    return 'Front-end SPA em React orientado a componentes.';
  }

  return 'Arquitetura nao classificada automaticamente. Revisar manualmente com mais artefatos.';
}

function c4TextBase(projectName) {
  return {
    context: [
      `Sistema: ${projectName} (plataforma web para descoberta/divulgacao de eventos locais).`,
      'Pessoa: Publico local (busca eventos, cursos e atividades por cidade).',
      'Pessoa: Organizador (publica eventos e acompanha reservas/ingressos).',
      'Sistema Externo: Backend ConVive API (autenticacao, usuarios, administracao e dados de eventos).',
      'Relacoes:',
      'Publico local -> ConVive Web: consulta feed, busca e visualiza detalhes.',
      'Organizador -> ConVive Web: cadastra conta e gerencia conteudo/eventos.',
      'ConVive Web -> ConVive API: autentica, cria usuarios e obtem recursos protegidos.',
    ],
    container: [
      'Container 1: Web App React (Vite) - UI, roteamento de fluxo e filtros locais.',
      'Container 2: Theme Engine - variaveis CSS e troca de tema por cidade.',
      'Container 3: Service Layer - wrapper backendFetch + backendRoutes.',
      'Container 4: ConVive API (externo) - regras de autenticacao, usuarios e dominio.',
      'Relacoes:',
      'Web App React usa Theme Engine para identidade visual por cidade.',
      'Web App React usa Service Layer para comunicacao HTTP padronizada.',
      'Service Layer consome ConVive API via REST/JSON.',
    ],
    component: [
      'Componente: App (orquestracao de estados de tela e cidade selecionada).',
      'Componente: CityOnboardingScreen (entrada de cidade e aplicacao de tema).',
      'Componente: CityLandingScreen (feed, filtros, busca e detalhes de item).',
      'Componente: LoginScreen e SignupScreen (acesso e cadastro segmentado).',
      'Componente: cityFeedData + cityFeedUtils (dados locais e logica de filtro).',
      'Componente: backendRoutes + backendFetch (contrato de endpoints e cliente HTTP).',
    ],
    code: [
      'Fluxo de codigo recomendado para detalhamento:',
      '1) App.handleCitySelected -> applyCityTheme -> estado global de cidade.',
      '2) CityLandingScreen -> filterCityFeed -> renderizacao dos cards filtrados.',
      '3) Submit de Login/Cadastro -> Service Layer -> backendFetch -> API.',
      '4) Tratamento de erro backendFetch -> exibicao de feedback na UI.',
    ],
  };
}

function markdownSection(title, bodyLines) {
  return [`## ${title}`, '', ...bodyLines, ''].join('\n');
}

function buildReport({
  projectName,
  generatedAt,
  technologies,
  architecture,
  layers,
  structure,
  businessRules,
  goodPractices,
  risks,
  c4,
}) {
  const sections = [];

  sections.push(`# Documentacao Tecnica - ${projectName}`);
  sections.push('');
  sections.push(`Gerado automaticamente em: ${generatedAt}`);
  sections.push('');

  sections.push(markdownSection('Resumo Executivo', [
    `${projectName} e um front-end SPA orientado a comunidade local, com foco em descoberta e divulgacao de eventos por cidade.`,
    `Stack principal detectada: ${technologies.join(', ') || 'nao identificado automaticamente'}.`,
    'A organizacao atual privilegia separacao por feature e camada de servicos, favorecendo evolucao incremental.',
  ]));

  sections.push(markdownSection('Visao Geral do Sistema', [
    '- Objetivo: conectar publico local e organizadores em uma vitrine hiper-local de eventos, cursos e atividades.',
    '- Escopo atual: onboarding por cidade, feed filtravel, telas de login/cadastro e base de integracao com API.',
    '- Status funcional: experiencia de navegacao pronta no front-end, com integracoes criticas ainda pendentes.',
  ]));

  sections.push(markdownSection('Tecnologias Utilizadas', technologies.map((t) => `- ${t}`)));

  sections.push(markdownSection('Arquitetura e Organizacao', [
    architecture,
    '',
    'Camadas identificadas:',
    ...layers.map((layer) => `- ${layer}`),
    '',
    'Estrutura do projeto (amostra):',
    ...structure.flatMap((item) => [
      `- ${item.group} (${item.count} arquivo(s) mapeado(s))`,
      ...item.examples.map((ex) => `  - ${ex}`),
    ]),
  ]));

  sections.push(markdownSection('Regras de Negocio Identificadas', businessRules.map((rule, idx) => {
    return `${idx + 1}. [${rule.type}] ${rule.rule} (evidencia: ${rule.evidence})`;
  })));

  sections.push(markdownSection('Boas Praticas Observadas', goodPractices.map((practice) => `- ${practice}`)));

  sections.push(markdownSection('Pontos de Atencao e Riscos Tecnicos', risks.map((risk, idx) => {
    return `${idx + 1}. (${risk.severity}) ${risk.item} Impacto: ${risk.impact} Evidencia: ${risk.evidence}.`;
  })));

  sections.push(markdownSection('Lacunas de Documentacao e Inconsistencias', [
    '- Nao foram encontrados artefatos formais de arquitetura (ADR, diagramas, wiki tecnica ou README detalhado de dominio).',
    '- Regras comerciais aparecem em texto de interface, mas sem fonte unica versionada de regras de negocio.',
    '- Contratos de API ainda nao estao documentados no repositorio (ex.: OpenAPI/Swagger local).',
    '- Nao ha politica explicita de testes e criterios de qualidade por camada.',
  ]));

  sections.push(markdownSection('Sugestao de Diagramas C4 (Base Textual)', [
    '### Contexto',
    ...c4.context.map((line) => `- ${line}`),
    '',
    '### Containers',
    ...c4.container.map((line) => `- ${line}`),
    '',
    '### Componentes',
    ...c4.component.map((line) => `- ${line}`),
    '',
    '### Codigo (quando aplicavel)',
    ...c4.code.map((line) => `- ${line}`),
  ]));

  sections.push(markdownSection('Recomendacoes Tecnicas Objetivas', [
    '1. Integrar LoginScreen/SignupScreen ao backendFetch com validacao de formulario e tratamento de erro padronizado.',
    '2. Criar testes unitarios para cityFeedUtils e testes de integracao para fluxos de onboarding/login/cadastro.',
    '3. Extrair regras comerciais (gratuito/pago, taxa, limites de vagas) para modulo de dominio centralizado.',
    '4. Formalizar documentacao de API e contratos de dados para reduzir divergencia front-back.',
    '5. Introduzir observabilidade minima (telemetria de erros e eventos de conversao por fluxo).',
  ]));

  sections.push(markdownSection('Conclusao Tecnica', [
    'O projeto demonstra boa base estrutural para evolucao, especialmente em separacao por features e padronizacao visual por cidade.',
    'Para uso academico e maturidade de engenharia, o principal gap e transformar fluxos atualmente demonstrativos em fluxos transacionais reais com testes e documentacao de arquitetura continuamente atualizada.',
  ]));

  return sections.join('\n');
}

function main() {
  const packageJsonPath = path.resolve(cwd, 'package.json');
  const packageJson = readJsonSafe(packageJsonPath);
  const projectName = packageJson?.name ?? path.basename(cwd);

  const allFiles = walkDirectory(cwd);
  const samples = readSamples(allFiles);
  const technologies = detectTechnologies(packageJson, allFiles);
  const layers = identifyLayers(allFiles);
  const structure = groupProjectStructure(allFiles);
  const businessRules = extractBusinessRules(samples);
  const goodPractices = detectGoodPractices(samples, packageJson);
  const risks = detectRisks(samples);
  const architecture = inferArchitecture(technologies, allFiles);
  const c4 = c4TextBase(projectName);

  const report = buildReport({
    projectName,
    generatedAt: new Date().toISOString(),
    technologies,
    architecture,
    layers,
    structure,
    businessRules,
    goodPractices,
    risks,
    c4,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report, 'utf8');

  process.stdout.write(`ProjectDoc AI report generated at: ${toPosix(path.relative(cwd, outputPath))}\n`);
}

main();
