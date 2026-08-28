(() => {
  const main = document.querySelector('[data-module-source]');
  if (!main) return;

  const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (text) => escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');
  const slug = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Le um bloco isolado: enunciado, quatro alternativas e a resposta comentada.
  function parseBlock(source) {
    const answer = source.match(/\*\*Resposta:\s*([A-D])\.\*\*\s*([\s\S]*)$/);
    const options = [...source.matchAll(/\*\*([A-D])\.\*\*\s*([\s\S]*?)(?=(?:\s{2,}\n?\*\*[A-D]\.\*)|\n\n\*\*Resposta:|$)/g)];
    const stem = source.split(/\*\*A\.\*\*/)[0].trim();
    if (!answer || options.length !== 4) return null;
    return {
      stem,
      answer: answer[1],
      explanation: answer[2].trim(),
      options: options.map((option) => ({ key: option[1], text: option[2].trim() }))
    };
  }

  // A secao de treino aceita uma questao (padrao antigo) ou varias em sequencia.
  function makeQuiz(markdown) {
    const section = markdown.match(/### Quest(?:ão Objetiva Comentada|ões Objetivas Comentadas)\s+([\s\S]*?)\s+### Roteiro De Resposta Discursiva/);
    if (!section) return { markdown, quizzes: [] };
    const region = section[1].trim();

    // Cada questao termina no paragrafo iniciado por **Resposta: X.**
    const boundaries = [...region.matchAll(/\*\*Resposta:\s*[A-D]\.\*\*/g)];
    const chunks = [];
    let start = 0;
    boundaries.forEach((mark) => {
      const paragraphEnd = region.indexOf('\n\n', mark.index);
      const end = paragraphEnd === -1 ? region.length : paragraphEnd;
      chunks.push(region.slice(start, end).trim());
      start = end;
    });

    const quizzes = chunks.map(parseBlock).filter(Boolean);
    if (!quizzes.length) return { markdown, quizzes: [] };
    return {
      markdown: markdown.replace(section[0], '<div class="module-quiz-slot"></div>\n\n### Roteiro De Resposta Discursiva'),
      quizzes
    };
  }

  function markdownToHtml(markdown) {
    const lines = markdown.replace(/^---[\s\S]*?---\s*/, '').split(/\r?\n/);
    const result = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      if (line === '<div class="module-quiz-slot"></div>') { result.push(line); i++; continue; }
      if (/^#{1,3} /.test(line)) {
        const [, hashes, title] = line.match(/^(#{1,3})\s+(.+)$/);
        const level = hashes.length;
        result.push(`<h${level}${level === 2 ? ` id="${slug(title)}"` : ''}>${inline(title)}</h${level}>`);
        i++; continue;
      }
      if (/^\|/.test(line)) {
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        const cells = (row) => row.split('|').slice(1, -1).map((cell) => cell.trim());
        const header = cells(rows[0]);
        const body = rows.slice(2).map(cells);
        result.push(`<div class="table-wrap"><table><thead><tr>${header.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (/^> /.test(line)) { result.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); i++; continue; }
      if (/^[-*] /.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(`<li>${inline(lines[i].slice(2))}</li>`); i++; }
        result.push(`<ul>${items.join('')}</ul>`); continue;
      }
      if (/^\d+\. /.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\d+\. /, ''))}</li>`); i++; }
        result.push(`<ol>${items.join('')}</ol>`); continue;
      }
      const paragraph = [line]; i++;
      while (i < lines.length && lines[i].trim() && !/^#{1,3} |^\||^> |^[-*] |^\d+\. /.test(lines[i])) { paragraph.push(lines[i]); i++; }
      result.push(`<p>${inline(paragraph.join(' ')).replace(/  /g, '<br>')}</p>`);
    }
    return result.join('\n');
  }

  function insertQuiz(quizzes) {
    const slot = document.querySelector('.module-quiz-slot');
    if (!slot || !quizzes.length) return;
    const many = quizzes.length > 1;
    const titulo = many ? `Treino objetivo — ${quizzes.length} questões` : 'Questão objetiva';
    const cards = quizzes.map((quiz, index) => {
      const name = `module-question-${index + 1}`;
      const rotulo = many ? `Questão ${index + 1} de ${quizzes.length}` : 'Escolha uma alternativa';
      return `<fieldset class="question-card interactive-question" data-question="${index + 1}"><legend>${rotulo}</legend><p class="question-stem">${inline(quiz.stem)}</p><div class="options-list">${quiz.options.map((option) => `<label class="option-row"><input type="radio" name="${name}" value="${option.key}"><span><strong>${option.key}.</strong> ${inline(option.text)}</span></label>`).join('')}</div><div class="quiz-feedback" hidden aria-live="polite"></div></fieldset>`;
    }).join('');
    slot.outerHTML = `<section class="quiz-panel" aria-labelledby="titulo-treino"><h2 id="titulo-treino">${titulo}</h2>${many ? '<p>Responda uma de cada vez. O comentário aparece assim que você marcar a alternativa.</p>' : ''}${cards}</section>`;

    document.querySelectorAll('.interactive-question').forEach((card, index) => {
      const quiz = quizzes[index];
      card.querySelectorAll('input[type="radio"]').forEach((input) => input.addEventListener('change', (event) => {
        const feedback = card.querySelector('.quiz-feedback');
        const correct = event.target.value === quiz.answer;
        feedback.hidden = false;
        feedback.className = `quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`;
        feedback.innerHTML = `<p><strong>${correct ? 'Resposta correta.' : 'Ainda não.'}</strong> ${correct ? inline(quiz.explanation) : `A alternativa correta é <strong>${quiz.answer}</strong>. ${inline(quiz.explanation)}`}</p>`;
      }));
    });
  }

  fetch(main.dataset.moduleSource)
    .then((response) => { if (!response.ok) throw new Error('Falha ao carregar o material.'); return response.text(); })
    .then((raw) => {
      const prepared = makeQuiz(raw);
      main.innerHTML = `${markdownToHtml(prepared.markdown)}<section class="ai-disclosure compact"><h2>Nota de transparência sobre uso de IA</h2><p>Este material fez uso de Inteligência Artificial Generativa (Codex, da OpenAI) para organização e estruturação do texto, revisão de redação e estilo, revisão de coerência e consistência argumentativa, preparação visual ou adaptação didática e apoio à elaboração de questões e atividades, observadas as diretrizes da Portaria CNPq nº 2.664/2026. A seleção do conteúdo, a conferência das fontes e a responsabilidade final são do docente responsável.</p></section>`;
      insertQuiz(prepared.quizzes);
      document.querySelector('[data-module-status]').textContent = 'Material carregado.';
    })
    .catch(() => { main.innerHTML = '<section class="notice"><strong>Não foi possível carregar este material.</strong> Atualize a página ou tente novamente mais tarde.</section>'; });
})();
