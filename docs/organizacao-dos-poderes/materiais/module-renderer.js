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
    const stem = source.split(/\*\*A\.\*\*/)[0].replace(/^#{2,4} .*$/m, '').trim();
    if (!answer || options.length !== 4) return null;
    return {
      stem,
      answer: answer[1],
      explanation: answer[2].trim(),
      options: options.map((option) => ({ key: option[1], text: option[2].trim() }))
    };
  }

  // Quebra uma regiao de treino em questoes: cada uma termina no paragrafo **Resposta: X.**
  function splitQuestions(region) {
    const boundaries = [...region.matchAll(/\*\*Resposta:\s*[A-D]\.\*\*/g)];
    const chunks = [];
    let start = 0;
    boundaries.forEach((mark) => {
      const paragraphEnd = region.indexOf('\n\n', mark.index);
      const end = paragraphEnd === -1 ? region.length : paragraphEnd;
      chunks.push(region.slice(start, end).trim());
      start = end;
    });
    return chunks.map(parseBlock).filter(Boolean);
  }

  // Dois formatos aceitos:
  //  (a) legado — uma secao "### Questao(oes) Objetiva(s) Comentada(s)" ate "### Roteiro De Resposta Discursiva";
  //  (b) modular — varias secoes "### Treino N — titulo", cada uma no fim do seu topico.
  // O formato (b) e renderizado no lugar em que aparece, e nao no fim do texto.
  function makeQuizzes(markdown) {
    const panels = [];
    let working = markdown;

    // Sem a flag m: aqui $ precisa significar fim do texto, e nao fim de linha.
    const treinos = [...working.matchAll(/\n### (Treino[^\n]*)\n([\s\S]*?)(?=\n#{2,3} |$)/g)];
    if (treinos.length) {
      treinos.forEach((match) => {
        const questions = splitQuestions(match[2].trim());
        if (!questions.length) return;
        const index = panels.length;
        panels.push({ title: match[1].trim(), questions });
        working = working.replace(match[0], `<div class="module-quiz-slot" data-slot="${index}"></div>\n\n`);
      });
      if (panels.length) return { markdown: working, panels };
    }

    const legacy = working.match(/### Quest(?:ão Objetiva Comentada|ões Objetivas Comentadas)\s+([\s\S]*?)\s+### Roteiro De Resposta Discursiva/);
    if (!legacy) return { markdown, panels: [] };
    const questions = splitQuestions(legacy[1].trim());
    if (!questions.length) return { markdown, panels: [] };
    panels.push({ title: null, questions });
    return {
      markdown: working.replace(legacy[0], '<div class="module-quiz-slot" data-slot="0"></div>\n\n### Roteiro De Resposta Discursiva'),
      panels
    };
  }

  function markdownToHtml(markdown) {
    const lines = markdown.replace(/^---[\s\S]*?---\s*/, '').split(/\r?\n/);
    const result = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      if (/^<div class="module-quiz-slot"/.test(line)) { result.push(line); i++; continue; }
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

  function insertQuizzes(panels) {
    panels.forEach((panel, slotIndex) => {
      const slot = document.querySelector(`.module-quiz-slot[data-slot="${slotIndex}"]`);
      if (!slot) return;
      const quizzes = panel.questions;
      const many = quizzes.length > 1;
      const titulo = panel.title || (many ? `Treino objetivo — ${quizzes.length} questões` : 'Questão objetiva');
      const tituloId = `titulo-treino-${slotIndex}`;
      const cards = quizzes.map((quiz, index) => {
        const name = `module-question-${slotIndex}-${index + 1}`;
        const rotulo = many ? `Questão ${index + 1} de ${quizzes.length}` : 'Escolha uma alternativa';
        return `<fieldset class="question-card interactive-question" data-panel="${slotIndex}" data-question="${index + 1}"><legend>${rotulo}</legend><p class="question-stem">${inline(quiz.stem)}</p><div class="options-list">${quiz.options.map((option) => `<label class="option-row"><input type="radio" name="${name}" value="${option.key}"><span><strong>${option.key}.</strong> ${inline(option.text)}</span></label>`).join('')}</div><div class="quiz-feedback" hidden aria-live="polite"></div></fieldset>`;
      }).join('');
      slot.outerHTML = `<section class="quiz-panel" aria-labelledby="${tituloId}"><h2 id="${tituloId}">${titulo}</h2>${many ? '<p>Responda uma de cada vez. O comentário aparece assim que você marcar a alternativa.</p>' : ''}${cards}</section>`;

      document.querySelectorAll(`.interactive-question[data-panel="${slotIndex}"]`).forEach((card) => {
        const quiz = quizzes[Number(card.dataset.question) - 1];
        if (!quiz) return;
        card.querySelectorAll('input[type="radio"]').forEach((input) => input.addEventListener('change', (event) => {
          const feedback = card.querySelector('.quiz-feedback');
          const correct = event.target.value === quiz.answer;
          feedback.hidden = false;
          feedback.className = `quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`;
          feedback.innerHTML = `<p><strong>${correct ? 'Resposta correta.' : 'Ainda não.'}</strong> ${correct ? inline(quiz.explanation) : `A alternativa correta é <strong>${quiz.answer}</strong>. ${inline(quiz.explanation)}`}</p>`;
        }));
      });
    });
  }

  fetch(main.dataset.moduleSource)
    .then((response) => { if (!response.ok) throw new Error('Falha ao carregar o material.'); return response.text(); })
    .then((raw) => {
      const prepared = makeQuizzes(raw);
      main.innerHTML = `${markdownToHtml(prepared.markdown)}<section class="ai-disclosure compact"><h2>Nota de transparência sobre uso de IA</h2><p>Este material fez uso de Inteligência Artificial Generativa (Codex, da OpenAI) para organização e estruturação do texto, revisão de redação e estilo, revisão de coerência e consistência argumentativa, preparação visual ou adaptação didática e apoio à elaboração de questões e atividades, observadas as diretrizes da Portaria CNPq nº 2.664/2026. A seleção do conteúdo, a conferência das fontes e a responsabilidade final são do docente responsável.</p></section>`;
      insertQuizzes(prepared.panels);
      document.querySelector('[data-module-status]').textContent = 'Material carregado.';
    })
    .catch(() => { main.innerHTML = '<section class="notice"><strong>Não foi possível carregar este material.</strong> Atualize a página ou tente novamente mais tarde.</section>'; });
})();
