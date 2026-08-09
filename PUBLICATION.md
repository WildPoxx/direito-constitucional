# Rotina De Publicacao

Este repositorio publica o site da disciplina em:

```text
https://wildpoxx.github.io/direito-constitucional/
```

## Arquitetura

- Fonte de edicao: branch `main`, pasta `docs/`.
- Fonte servida pelo GitHub Pages: branch `gh-pages`, raiz `/`.
- Vault privado/sincronizado: `C:\Users\amari\source\Docência Geral`.
- Repositorio Git local: `C:\Users\amari\source\GITS\GitHub - Docência Geral\direito-constitucional`.

## Regra Principal

Editar conteudo publico em `main/docs/`. Publicar para `gh-pages` apenas depois de revisar se nao ha dados privados, respostas de alunos, materiais administrativos ou fontes protegidas.

## Publicacao Automatica

O workflow `.github/workflows/publish-pages.yml` copia `docs/` para o branch `gh-pages` quando `main` recebe push com alteracoes relevantes.

Fluxo normal:

```powershell
git status
git add .
git commit -m "Mensagem clara"
git push origin main
```

Depois do push, conferir:

```powershell
gh run list --workflow publish-pages.yml --limit 3
gh api repos/WildPoxx/direito-constitucional/pages
```

## Publicacao Manual De Emergencia

Usar apenas se o workflow falhar:

```powershell
git subtree push --prefix docs origin gh-pages
```

Se o comando recusar historico divergente, nao forcar sem antes revisar o branch `gh-pages`.

## Checklist Antes De Publicar

- [ ] O conteudo esta em `docs/`.
- [ ] Nao ha respostas de alunos, identificadores pessoais ou relatorios baixados.
- [ ] Nao ha documentos administrativos do vault.
- [ ] Nao ha PDFs/livros/fontes privadas sem autorizacao.
- [ ] Links principais foram conferidos localmente.
- [ ] `git status` foi lido no repositorio Git, nao no vault.
