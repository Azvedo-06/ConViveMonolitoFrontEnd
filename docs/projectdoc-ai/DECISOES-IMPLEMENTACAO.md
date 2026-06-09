# ProjectDoc AI - Decisoes de Implementacao

## Objetivo da abordagem
Entregar um prototipo reutilizavel, sem dependencias pesadas, com separacao clara entre:
- analise do repositorio;
- geracao textual da documentacao;
- apresentacao/exportacao em Markdown.

## Decisoes principais
1. Implementacao em Node.js puro (ESM)
- Motivo: simplicidade de execucao no ambiente de desenvolvimento ja existente.
- Resultado: script unico executavel por npm scripts.

2. Analise baseada em heuristicas controladas
- Motivo: permitir inferencia de regras sem exigir parser AST em etapa inicial.
- Resultado: identificacao de stack, camadas, regras explicitas/inferidas e riscos com evidencia textual.

3. Saida padronizada em Markdown
- Motivo: facilidade de leitura pela banca e versionamento no Git.
- Resultado: documento tecnico rastreavel e comparavel entre execucoes.

4. Prompt de skill versionado no repositorio
- Motivo: tornar o uso consistente entre membros da equipe no VS Code.
- Resultado: arquivo .github/prompts/projectdoc-ai.prompt.md com checklist e formato de saida.

5. Privacidade por design
- Motivo: reduzir risco de vazamento de dados sensiveis.
- Resultado: foco em metadados estruturais e codigo local, sem exportacao de credenciais.

## Cobertura dos requisitos
- Funcionais: cobertos por analise estrutural, identificacao tecnologica, regras de negocio, riscos, boas praticas e base C4.
- Nao funcionais: clareza, objetividade, reuso e separacao de responsabilidades foram priorizados.

## Estrategia C4 adotada
A estrategia gera base textual para:
- C4 Contexto: atores, sistema e relacoes externas.
- C4 Containers: app web, camada de tema, camada de servicos, backend externo.
- C4 Componentes: telas e modulos-chave por feature.
- C4 Codigo (quando aplicavel): fluxos de metodo/funcoes para detalhamento posterior.

## Caminho de evolucao
- Adicionar comparador de versoes e consistencia codigo x documentacao.
- Integrar deteccao de ausencia de testes e validacoes por camada com maior precisao.
- Gerar relatorio executivo dedicado para banca com semaforo de riscos.
