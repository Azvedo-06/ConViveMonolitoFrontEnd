# ProjectDoc AI - Guia de Uso

## 1. Visao geral
ProjectDoc AI e um prototipo de skill para documentacao tecnica automatizada em projetos de software.

No estado atual, ele funciona em duas frentes:
- Prompt reutilizavel para Copilot Chat: .github/prompts/projectdoc-ai.prompt.md
- Gerador automatizado via script Node.js: scripts/projectdoc-ai/generateProjectDoc.mjs

## 2. Comando de prompt (Copilot Chat)
Frase recomendada:

Analise este projeto e gere uma documentacao tecnica completa com regras de negocio, arquitetura, boas praticas e sugestao de diagramas C4.

## 3. Geracao automatica via terminal
Na raiz do projeto:

```bash
npm run projectdoc:generate
```

Saida padrao:
- docs/projectdoc-ai/output/projectdoc-report.md

Relatorio alternativo:

```bash
npm run projectdoc:report
```

Saida:
- docs/projectdoc-ai/output/projectdoc-relatorio-executivo.md

## 4. Entradas analisadas
- Estrutura de pastas e arquivos
- package.json e configuracoes de build
- Arquivos fonte TS/TSX/JS/JSX/CSS/MD/YAML
- Nomes de modulos, funcoes e constantes
- Comentarios no codigo

## 5. Saida esperada
O documento gerado inclui:
- Resumo executivo
- Visao geral do sistema
- Tecnologias utilizadas
- Arquitetura e organizacao
- Regras de negocio identificadas (explicitas e inferidas)
- Boas praticas observadas
- Pontos de atencao e riscos
- Lacunas/inconsistencias
- Base textual para C4
- Recomendacoes tecnicas
- Conclusao tecnica

## 6. Limitacoes atuais
- Heuristica textual (nao executa analise semantica profunda de AST)
- Nao integra diff entre commits automaticamente
- Nao gera diagrama visual automaticamente; entrega base textual C4

## 7. Evolucoes recomendadas
- Adicionar modo de comparacao entre versoes (git diff)
- Integrar extracao de contrato de API (OpenAPI)
- Incluir score de qualidade por dominio (testes, acoplamento, cobertura)
- Gerar artefatos C4 em formato Structurizr DSL e Mermaid
