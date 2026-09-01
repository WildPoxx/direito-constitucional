/* Renderizador de módulos — Direitos Fundamentais
 * Cópia própria da disciplina. Não compartilhada com Organização dos Poderes
 * nem com Teoria da Constituição: alterações aqui não afetam aquelas páginas.
 *
 * Política de dados: a correção acontece no navegador. Nenhuma resposta é
 * enviada, armazenada ou associada ao estudante. O relatório é gerado
 * localmente e só sai daqui se a pessoa copiar ou baixar.
 */
(() => {
  const main = document.querySelector('[data-module-source]');
  if (!main) return;

  const DECLARACAO_IA =
    'Este material fez uso de Inteligência Artificial Generativa (ChatGPT e Codex, da OpenAI, ' +
    'e Claude, da Anthropic) para organização e estruturação do texto, revisão de redação e ' +
    'estilo, revisão de coerência e consistência argumentativa, preparação visual ou adaptação ' +
    'didática e apoio à elaboração de questões e atividades, observadas as diretrizes da ' +
    'Portaria CNPq nº 2.664/2026. A seleção do conteúdo, a leitura das fontes doutrinárias e ' +
    'normativas, a conferência das referências e a responsabilidade final são do docente ' +
    'responsável.';

  const escapeHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (t) => escapeHtml(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2">$2</a>');
  const slug = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const semMarcacao = (t) => t.replace(/\*\*/g, '').replace(/\*/g, '').trim();

  /* ---------- extração do bloco de treino ---------- */

  function extrairTreino(markdown) {
    const inicio = markdown.indexOf('## Treino');
    if (inicio < 0) return { markdown, questoes: [] };
    const resto = markdown.slice(inicio + '## Treino'.length);
    const fim = resto.search(/\n#{2,3} (?!#)/);
    const bloco = fim < 0 ? resto : resto.slice(0, fim);

    const questoes = [];
    const partes = bloco.split(/\n#### +/).slice(1);
    partes.forEach((parte, indice) => {
      const titulo = parte.split('\n')[0].trim();
      const corpo = parte.slice(parte.indexOf('\n') + 1);
      const marcaResposta = corpo.match(/\*\*Resposta:\s*([A-D])\.\*\*/);
      if (!marcaResposta) return;
      const antes = corpo.slice(0, marcaResposta.index);
      const depois = corpo.slice(marcaResposta.index + marcaResposta[0].length);

      const primeiraAlt = antes.search(/\n\*\*A\.\*\*/);
      if (primeiraAlt < 0) return;
      const enunciado = antes.slice(0, primeiraAlt).trim();
      const alternativas = [...antes.slice(primeiraAlt).matchAll(
        /\*\*([A-D])\.\*\*\s*([\s\S]*?)(?=\n\s*\n\*\*[A-D]\.\*\*|$)/g
      )].map((m) => ({ chave: m[1], texto: m[2].trim() }));
      if (alternativas.length !== 4) return;

      const porAlternativa = {};
      [...depois.matchAll(/^- \*\*([A-D])\*\*\s*([\s\S]*?)(?=\n- \*\*[A-D]\*\*|$)/gm)]
        .forEach((m) => { porAlternativa[m[1]] = m[2].trim(); });
      const geral = depois.split(/\n- \*\*[A-D]\*\*/)[0].trim();

      questoes.push({
        id: indice + 1,
        titulo,
        enunciado,
        alternativas,
        correta: marcaResposta[1],
        explicacaoCorreta: geral,
        explicacoes: porAlternativa
      });
    });

    if (!questoes.length) {
      // Falha de leitura: remove o bloco inteiro em vez de expor o gabarito.
      const limpo = markdown.slice(0, inicio) +
        '\n<div class="module-quiz-slot" data-falha="1"></div>\n' +
        (fim < 0 ? '' : resto.slice(fim));
      return { markdown: limpo, questoes: [] };
    }
    const limpo = markdown.slice(0, inicio) +
      '\n<div class="module-quiz-slot"></div>\n' +
      (fim < 0 ? '' : resto.slice(fim));
    return { markdown: limpo, questoes };
  }

  /* ---------- markdown -> html ---------- */

  function markdownToHtml(markdown) {
    const linhas = markdown.replace(/^---[\s\S]*?---\s*/, '').split(/\r?\n/);
    const saida = [];
    let i = 0;
    while (i < linhas.length) {
      const linha = linhas[i];
      if (!linha.trim()) { i++; continue; }
      if (/^<div class="module-quiz-slot"/.test(linha)) { saida.push(linha); i++; continue; }
      if (/^#{1,4} /.test(linha)) {
        const [, cerquilhas, titulo] = linha.match(/^(#{1,4})\s+(.+)$/);
        const nivel = cerquilhas.length;
        saida.push(`<h${nivel}${nivel === 2 ? ` id="sec-${slug(titulo)}"` : ''}>${inline(titulo)}</h${nivel}>`);
        i++; continue;
      }
      if (/^\|/.test(linha)) {
        const linhasTabela = [];
        while (i < linhas.length && /^\|/.test(linhas[i])) { linhasTabela.push(linhas[i]); i++; }
        const celulas = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
        const cabecalho = celulas(linhasTabela[0]);
        const corpo = linhasTabela.slice(2).map(celulas);
        saida.push(`<div class="table-wrap"><table><thead><tr>${cabecalho.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${corpo.map((l) => `<tr>${l.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (/^> /.test(linha)) { saida.push(`<blockquote>${inline(linha.slice(2))}</blockquote>`); i++; continue; }
      if (/^[-*] /.test(linha)) {
        const itens = [];
        while (i < linhas.length && /^[-*] /.test(linhas[i])) {
          let texto = linhas[i].slice(2); i++;
          while (i < linhas.length && /^\s{2,}\S/.test(linhas[i])) { texto += ' ' + linhas[i].trim(); i++; }
          itens.push(`<li>${inline(texto)}</li>`);
        }
        saida.push(`<ul>${itens.join('')}</ul>`); continue;
      }
      if (/^\d+\. /.test(linha)) {
        const itens = [];
        while (i < linhas.length && /^\d+\. /.test(linhas[i])) {
          let texto = linhas[i].replace(/^\d+\.\s+/, ''); i++;
          while (i < linhas.length && /^\s{2,}\S/.test(linhas[i])) { texto += ' ' + linhas[i].trim(); i++; }
          itens.push(`<li>${inline(texto)}</li>`);
        }
        saida.push(`<ol>${itens.join('')}</ol>`); continue;
      }
      const paragrafo = [linha]; i++;
      while (i < linhas.length && linhas[i].trim() && !/^#{1,4} |^\||^> |^[-*] |^\d+\. |^<div class="module-quiz-slot"/.test(linhas[i])) {
        paragrafo.push(linhas[i]); i++;
      }
      saida.push(`<p>${inline(paragrafo.join(' '))}</p>`);
    }
    return saida.join('\n');
  }

  /* ---------- painel de treino ---------- */

  function montarPainel(questoes) {
    const slot = document.querySelector('.module-quiz-slot');
    if (!slot) return;

    if (!questoes.length) {
      slot.outerHTML = '<section class="notice"><strong>O treino desta página não pôde ser carregado.</strong> ' +
        'O conteúdo do módulo acima está completo. Avise o professor para que o exercício seja restabelecido.</section>';
      return;
    }

    const html = questoes.map((q) => `
      <fieldset class="question-card interactive-question" data-questao="${q.id}">
        <legend>Questão ${q.id}</legend>
        <p>${inline(q.enunciado)}</p>
        <div class="options-list">${q.alternativas.map((a) => `
          <label class="option-row" data-alternativa="${a.chave}"><input type="radio" name="questao-${q.id}" value="${a.chave}">
          <span><strong>${a.chave}.</strong> ${inline(a.texto)}</span></label>`).join('')}
        </div>
        <div class="actions-panel actions-inline">
          <button type="button" class="secondary-button" data-acao="conferir" data-alvo="${q.id}">Conferir resposta</button>
        </div>
        <div class="quiz-feedback" hidden aria-live="polite"></div>
      </fieldset>`).join('');

    slot.outerHTML = `
      <section class="quiz-panel" aria-labelledby="titulo-treino">
        <h2 id="titulo-treino">Treino</h2>
        <p class="notice">Marque a alternativa e clique em <strong>Conferir resposta</strong>, na própria questão:
        o comentário abre ali mesmo, alternativa por alternativa. Ao final, se quiser um registro do conjunto,
        use <strong>Gerar relatório</strong>. A correção acontece no seu navegador: nada é enviado, nada é
        armazenado e nenhuma resposta fica associada a você.</p>
        ${html}
        <div class="actions-panel">
          <button type="button" class="primary-button" data-acao="corrigir">Conferir todas e gerar relatório</button>
          <button type="button" class="secondary-button" data-acao="limpar">Limpar respostas</button>
        </div>
        <div class="results-panel" hidden>
          <h3>Relatório de treino</h3>
          <pre class="report-box" tabindex="0"></pre>
          <div class="actions-panel">
            <button type="button" class="primary-button" data-acao="copiar">Copiar relatório</button>
            <button type="button" class="secondary-button" data-acao="baixar">Baixar TXT</button>
          </div>
          <p>Para pedir devolutiva, envie o arquivo para o e-mail informado pelo professor em aula.</p>
        </div>
      </section>`;

    const painel = document.querySelector('.quiz-panel');
    const relatorio = painel.querySelector('.results-panel');
    const textoRelatorio = painel.querySelector('.report-box');
    const porId = {};
    questoes.forEach((q) => { porId[q.id] = q; });

    const escolhida = (id) => {
      const marcado = painel.querySelector(`input[name="questao-${id}"]:checked`);
      return marcado ? marcado.value : null;
    };

    // Comentario completo de uma questao: veredito da escolha + as quatro alternativas.
    function detalhar(q) {
      const escolha = escolhida(q.id);
      const acertou = escolha === q.correta;
      let cabecalho;
      if (!escolha) {
        cabecalho = `<p class="verdict-line"><strong>Sem resposta marcada.</strong> A correta é a <strong>${q.correta}</strong>.</p>`;
      } else if (acertou) {
        cabecalho = `<p class="verdict-line"><strong>Você acertou.</strong> A correta é a <strong>${q.correta}</strong>.</p>`;
      } else {
        cabecalho = `<p class="verdict-line"><strong>Você marcou ${escolha}.</strong> A correta é a <strong>${q.correta}</strong>.</p>`;
      }
      const linhas = q.alternativas.map((a) => {
        const certa = a.chave === q.correta;
        const marcada = a.chave === escolha;
        const texto = certa ? q.explicacaoCorreta : (q.explicacoes[a.chave] || 'Sem comentário registrado para esta alternativa.');
        const classes = ['answer-line', certa ? 'is-correct' : 'is-wrong'];
        if (marcada) classes.push('is-chosen');
        const selo = certa ? 'Correta' : 'Não se sustenta';
        const marca = marcada ? ' · sua escolha' : '';
        return `<p class="${classes.join(' ')}"><span class="verdict">${a.chave} — ${selo}${marca}</span>${inline(texto)}</p>`;
      }).join('');
      return { escolha, acertou, html: cabecalho + `<div class="answer-breakdown">${linhas}</div>` };
    }

    function conferir(id, forcar) {
      const q = porId[id];
      if (!q) return;
      const cartao = painel.querySelector(`[data-questao="${id}"]`);
      const campo = cartao.querySelector('.quiz-feedback');
      const botao = cartao.querySelector('[data-acao="conferir"]');
      if (!forcar && !campo.hidden) {           // segundo clique fecha
        campo.hidden = true;
        campo.innerHTML = '';
        campo.className = 'quiz-feedback';
        botao.textContent = 'Conferir resposta';
        cartao.querySelectorAll('.option-row').forEach((l) => {
          l.classList.remove('is-correct', 'is-chosen-wrong');
        });
        return;
      }
      const d = detalhar(q);
      campo.className = 'quiz-feedback' + (d.escolha ? (d.acertou ? ' is-correct' : ' is-wrong') : '');
      campo.innerHTML = d.html;
      campo.hidden = false;
      botao.textContent = 'Ocultar resposta';
      cartao.querySelectorAll('.option-row').forEach((l) => {
        const chave = l.dataset.alternativa;
        l.classList.toggle('is-correct', chave === q.correta);
        l.classList.toggle('is-chosen-wrong', chave === d.escolha && chave !== q.correta);
      });
      return d;
    }

    function corrigir() {
      let acertos = 0;
      const cartao = document.querySelector('.hero .tag');
      const tituloPagina = document.querySelector('.hero h1');
      const linhas = [
        'RELATORIO DE TREINO' + (cartao ? ' — ' + semMarcacao(cartao.textContent) : ''),
        tituloPagina ? semMarcacao(tituloPagina.textContent) : document.title,
        ''
      ];
      questoes.forEach((q) => {
        const d = conferir(q.id, true);
        if (d.acertou) acertos++;
        linhas.push(`Questao ${q.id}: sua resposta = ${d.escolha || '(em branco)'} | correta = ${q.correta} | ${d.acertou ? 'ACERTOU' : 'REVER'}`);
        q.alternativas.forEach((a) => {
          const certa = a.chave === q.correta;
          const texto = certa ? q.explicacaoCorreta : (q.explicacoes[a.chave] || '');
          if (!texto) return;
          linhas.push(`  ${a.chave} (${certa ? 'correta' : 'nao se sustenta'}): ${semMarcacao(texto)}`);
        });
        linhas.push('');
      });
      linhas.splice(3, 0, `Desempenho nas objetivas: ${acertos} de ${questoes.length}.`, '');
      const itensAuto = (main.dataset.autoavaliacao || '')
        .split('|').map((i) => i.trim()).filter(Boolean);
      if (itensAuto.length) {
        linhas.push('AUTOAVALIACAO DA DISCURSIVA');
        linhas.push('Releia o roteiro de resposta discursiva e verifique se seu texto:');
        itensAuto.forEach((i) => linhas.push('  ( ) ' + i));
        linhas.push('');
      }
      linhas.push('Relatorio gerado no navegador. Nenhuma resposta foi enviada ou armazenada pelo site.');
      textoRelatorio.textContent = linhas.join('\n');
      relatorio.hidden = false;
      relatorio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function limpar() {
      painel.querySelectorAll('input[type="radio"]').forEach((i) => { i.checked = false; });
      painel.querySelectorAll('.quiz-feedback').forEach((f) => {
        f.hidden = true; f.innerHTML = ''; f.className = 'quiz-feedback';
      });
      painel.querySelectorAll('[data-acao="conferir"]').forEach((b) => { b.textContent = 'Conferir resposta'; });
      painel.querySelectorAll('.option-row').forEach((l) => { l.classList.remove('is-correct', 'is-chosen-wrong'); });
      relatorio.hidden = true;
      textoRelatorio.textContent = '';
    }

    const nomeArquivo = () => {
      const t = document.querySelector('.hero h1');
      const base = t ? slug(semMarcacao(t.textContent)) : 'modulo';
      return `relatorio-treino-${base}.txt`;
    };

    painel.addEventListener('click', (evento) => {
      const alvo = evento.target.closest ? evento.target.closest('[data-acao]') : null;
      const acao = alvo && alvo.dataset.acao;
      if (!acao) return;
      if (acao === 'conferir') return void conferir(alvo.dataset.alvo, false);
      if (acao === 'corrigir') return corrigir();
      if (acao === 'limpar') return limpar();
      if (acao === 'copiar') {
        const texto = textoRelatorio.textContent;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(texto).then(
            () => { alvo.textContent = 'Relatório copiado'; },
            () => { alvo.textContent = 'Selecione e copie o texto acima'; }
          );
        } else {
          alvo.textContent = 'Selecione e copie o texto acima';
        }
        setTimeout(() => { alvo.textContent = 'Copiar relatório'; }, 2500);
        return;
      }
      if (acao === 'baixar') {
        const blob = new Blob([textoRelatorio.textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });
  }

  /* ---------- sumário automático ---------- */

  function montarSumario() {
    const nav = document.querySelector('.toc-links');
    if (!nav) return;
    const titulos = [...main.querySelectorAll('h2[id]')]
      .filter((h) => !/^(texto de apoio|refer)/i.test(h.textContent.trim()));
    if (!titulos.length) return;
    nav.innerHTML = titulos.map((h) => {
      const rotulo = h.textContent.replace(/^\d+\.\s*/, '').trim();
      return `<a href="#${h.id}">${escapeHtml(rotulo)}</a>`;
    }).join('');
  }

  fetch(main.dataset.moduleSource)
    .then((r) => { if (!r.ok) throw new Error('Falha ao carregar o material.'); return r.text(); })
    .then((bruto) => {
      const preparado = extrairTreino(bruto);
      main.innerHTML = `${markdownToHtml(preparado.markdown)}` +
        `<section class="ai-disclosure compact"><h2>Nota de transparência sobre uso de IA</h2>` +
        `<p>${DECLARACAO_IA}</p></section>`;
      montarPainel(preparado.questoes);
      montarSumario();
      const status = document.querySelector('[data-module-status]');
      if (status) status.textContent = 'Material carregado.';
    })
    .catch(() => {
      main.innerHTML = '<section class="notice"><strong>Não foi possível carregar este material.</strong> ' +
        'Atualize a página ou tente novamente mais tarde.</section>';
    });
})();
