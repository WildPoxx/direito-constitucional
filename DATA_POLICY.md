# Politica De Dados E Avaliacoes Informais

Este repositorio pode disponibilizar materiais da disciplina, atividades, provas-modelo, formularios estaticos e instrumentos de treino para alunos.

## Estado Atual

Os formularios interativos publicados em `docs/` devem funcionar, por padrao, apenas no navegador:

- corrigem respostas localmente;
- geram relatorio para download pelo usuario;
- nao enviam dados automaticamente;
- nao registram respostas em servidor;
- nao criam banco de dados publico.

## O Que Pode Entrar No Repositorio Publico

- Materiais de apoio autorizados para alunos.
- Planos de ensino institucionais que possam ser divulgados.
- Questoes-modelo, rubricas e atividades destinadas a treino.
- Codigo estatico do site e formularios.
- Documentacao operacional sem dados sensiveis.

## O Que Nao Deve Entrar No Repositorio Publico

- Respostas de alunos.
- Relatorios baixados dos formularios.
- Identificadores pessoais, e-mails, matriculas, notas ou frequencia.
- Analises internas de desempenho por aluno ou turma.
- Dados administrativos da faculdade.
- Fontes privadas do vault, livros, PDFs ou materiais protegidos que nao tenham autorizacao de publicacao.

## Evolucao Futura

Quando houver coleta real de respostas, ela deve ser criada como camada separada do site estatico, com decisao expressa sobre:

- onde os dados serao armazenados;
- quais dados serao coletados;
- quem podera acessar;
- como anonimizar ou pseudonimizar respostas;
- como exportar dados para analise interna;
- como informar os alunos sobre a finalidade pedagogica da coleta.

Enquanto essa decisao nao existir, o padrao e: **treino local, sem envio automatico de dados**.
