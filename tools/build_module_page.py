from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE = REPO_ROOT / "docs" / "direitos-fundamentais" / "materiais" / "modulo-1-dignidade-principios-efetividade-constitucional.md"
TARGET = SOURCE.with_suffix(".html")


QUIZ = [
    {
        "id": "q1",
        "title": "Questão 1 - Dignidade e Constituição",
        "prompt": "À luz da Constituição de 1988, a dignidade da pessoa humana deve ser compreendida principalmente como:",
        "options": {
            "A": "uma recomendação moral sem força jurídica própria.",
            "B": "um fundamento da República e princípio estruturante da interpretação constitucional.",
            "C": "um direito restrito ao art. 5º, sem relação com os demais princípios fundamentais.",
            "D": "uma regra fechada, aplicada apenas quando houver previsão literal de consequência jurídica."
        },
        "answer": "B",
        "feedback": {
            "A": "Errada. A dignidade não é apenas recomendação moral: ela aparece no art. 1º, III, da CF/88 e opera como fundamento jurídico da República.",
            "B": "Correta. A dignidade é fundamento constitucional e orienta a leitura dos direitos fundamentais, da atuação estatal e dos limites ao poder.",
            "C": "Errada. A dignidade antecede o art. 5º e dialoga com todo o sistema constitucional, inclusive objetivos, direitos sociais e interpretação dos direitos.",
            "D": "Errada. A dignidade funciona como princípio e norma aberta, não como regra fechada com consequência única e automática."
        },
        "source": "CF/88, art. 1º, III; Barroso, A dignidade da pessoa humana no direito constitucional contemporâneo."
    },
    {
        "id": "q2",
        "title": "Questão 2 - Princípios como normas",
        "prompt": "Quando se afirma que princípios também são normas jurídicas, a ideia central é que:",
        "options": {
            "A": "princípios são sempre inferiores às regras e podem ser ignorados pelo juiz.",
            "B": "princípios apenas expressam valores políticos sem aplicação em casos concretos.",
            "C": "princípios possuem força normativa e orientam a decisão, especialmente quando há colisão entre direitos ou valores constitucionais.",
            "D": "princípios eliminam a necessidade de fundamentação, porque permitem qualquer decisão."
        },
        "answer": "C",
        "feedback": {
            "A": "Errada. A teoria constitucional contemporânea reconhece força normativa aos princípios, ainda que seu modo de aplicação seja diferente do das regras.",
            "B": "Errada. Princípios podem orientar decisões concretas, políticas públicas e controle de constitucionalidade.",
            "C": "Correta. Dworkin e Alexy ajudam a compreender que princípios integram o Direito e exigem argumentação, coerência e ponderação quando entram em tensão.",
            "D": "Errada. O caráter aberto dos princípios aumenta a exigência de fundamentação; ele não autoriza decisão arbitrária."
        },
        "source": "Barroso, Fundamentos teóricos e filosóficos do novo direito constitucional brasileiro; Dworkin, Levando os direitos a sério; Alexy apresentado via Barroso."
    },
    {
        "id": "q3",
        "title": "Questão 3 - Direitos humanos e direitos fundamentais",
        "prompt": "A distinção didática mais adequada entre direitos humanos e direitos fundamentais é:",
        "options": {
            "A": "direitos humanos são direitos positivados na Constituição; direitos fundamentais só existem em tratados internacionais.",
            "B": "direitos humanos e direitos fundamentais são expressões sem qualquer relação entre si.",
            "C": "direitos humanos tendem a aparecer no plano internacional; direitos fundamentais são direitos reconhecidos e protegidos pela ordem constitucional interna.",
            "D": "direitos fundamentais não podem ter relação com dignidade, igualdade material ou cláusulas pétreas."
        },
        "answer": "C",
        "feedback": {
            "A": "Errada. A formulação inverte a distinção didática usual.",
            "B": "Errada. Os dois campos se comunicam: a Constituição pode internalizar valores e compromissos de direitos humanos.",
            "C": "Correta. A distinção é didática, não uma separação absoluta: direitos humanos costumam ser formulados internacionalmente, e direitos fundamentais aparecem constitucionalizados no direito interno.",
            "D": "Errada. Direitos fundamentais se relacionam diretamente com dignidade, igualdade, liberdade, proteção da pessoa e limites materiais de reforma constitucional."
        },
        "source": "CF/88, arts. 1º, 4º, II, 5º e 60, § 4º."
    }
]

DISCURSIVE = {
    "id": "d1",
    "title": "Questão discursiva - Dignidade, abertura e efetividade",
    "prompt": "Explique por que a dignidade da pessoa humana pode ser considerada um princípio estruturante da Constituição de 1988. Na resposta, indique o dispositivo constitucional pertinente, explique seu caráter de norma aberta e apresente uma consequência positiva e uma dificuldade prática desse modelo.",
    "rubric": [
        "Indica corretamente o art. 1º, III, da CF/88.",
        "Explica a dignidade como fundamento da República e eixo interpretativo dos direitos fundamentais.",
        "Distingue norma aberta de regra fechada, mostrando por que a dignidade exige interpretação.",
        "Aponta uma potência: adaptação a casos concretos, proteção contra humilhação ou atualização jurisprudencial.",
        "Aponta uma fragilidade: risco de abstração, insegurança jurídica ou uso retórico sem critérios.",
        "Conclui com aplicação constitucional coerente, sem transformar dignidade em justificativa para qualquer decisão."
    ],
    "source": "CF/88, art. 1º, III; Barroso, A dignidade da pessoa humana no direito constitucional contemporâneo; Barroso, Neoconstitucionalismo e constitucionalização do Direito."
}


AI_NOTICE = (
    "Este material fez uso de Inteligência Artificial Generativa (ChatGPT, modelo 5.5, e Claude Anthropic, modelo "
    "Alps 5.0) para organização e estruturação do texto, revisão de redação e estilo, preparação visual ou "
    "adaptação didática e apoio à elaboração de questões e atividades, observadas as diretrizes da Portaria CNPq "
    "nº 2.664/2026. A seleção do conteúdo, a conferência das fontes e a responsabilidade final são do docente "
    "responsável."
)


def slugify(value: str) -> str:
    value = value.lower()
    replacements = {
        "á": "a",
        "à": "a",
        "ã": "a",
        "â": "a",
        "é": "e",
        "ê": "e",
        "í": "i",
        "ó": "o",
        "ô": "o",
        "õ": "o",
        "ú": "u",
        "ç": "c",
        "º": "o",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "secao"


def inline(text: str) -> str:
    text = html.escape(text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", text)
    return text


def strip_frontmatter(text: str) -> str:
    lines = text.splitlines()
    if lines and lines[0].strip() == "---":
        for index, line in enumerate(lines[1:], start=1):
            if line.strip() == "---":
                return "\n".join(lines[index + 1 :]).strip()
    return text.strip()


def flush_paragraph(out: list[str], paragraph: list[str]) -> None:
    if paragraph:
        out.append(f"<p>{inline(' '.join(paragraph))}</p>")
        paragraph.clear()


def flush_list(out: list[str], items: list[str], ordered: bool) -> None:
    if not items:
        return
    tag = "ol" if ordered else "ul"
    out.append(f"<{tag}>")
    out.extend(f"<li>{inline(item)}</li>" for item in items)
    out.append(f"</{tag}>")
    items.clear()


def render_table(lines: Iterable[str]) -> str:
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(set(cell) <= {"-", ":", " "} for cell in cells):
            continue
        rows.append(cells)

    if not rows:
        return ""

    header, *body = rows
    parts = ['<div class="table-wrap"><table>']
    parts.append("<thead><tr>")
    parts.extend(f"<th>{inline(cell)}</th>" for cell in header)
    parts.append("</tr></thead>")
    if body:
        parts.append("<tbody>")
        for row in body:
            parts.append("<tr>")
            parts.extend(f"<td>{inline(cell)}</td>" for cell in row)
            parts.append("</tr>")
        parts.append("</tbody>")
    parts.append("</table></div>")
    return "\n".join(parts)


def markdown_to_html(text: str) -> tuple[str, list[tuple[str, str]]]:
    lines = strip_frontmatter(text).splitlines()
    out: list[str] = []
    toc: list[tuple[str, str]] = []
    paragraph: list[str] = []
    list_items: list[str] = []
    list_ordered = False
    used_ids: set[str] = set()
    index = 0

    while index < len(lines):
        line = lines[index].rstrip()

        if not line.strip():
            flush_paragraph(out, paragraph)
            flush_list(out, list_items, list_ordered)
            index += 1
            continue

        if line.strip() == "---":
            flush_paragraph(out, paragraph)
            flush_list(out, list_items, list_ordered)
            out.append('<hr aria-hidden="true">')
            index += 1
            continue

        heading = re.match(r"^(#{1,4})\s+(.+)$", line)
        if heading:
            flush_paragraph(out, paragraph)
            flush_list(out, list_items, list_ordered)
            level = len(heading.group(1))
            text_value = heading.group(2).strip()
            if level == 1:
                index += 1
                continue
            html_level = min(level, 4)
            base_id = slugify(text_value)
            heading_id = base_id
            counter = 2
            while heading_id in used_ids:
                heading_id = f"{base_id}-{counter}"
                counter += 1
            used_ids.add(heading_id)
            if html_level == 2:
                toc.append((heading_id, text_value))
            out.append(f'<h{html_level} id="{heading_id}">{inline(text_value)}</h{html_level}>')
            index += 1
            continue

        if line.startswith("|"):
            flush_paragraph(out, paragraph)
            flush_list(out, list_items, list_ordered)
            table_lines = []
            while index < len(lines) and lines[index].startswith("|"):
                table_lines.append(lines[index])
                index += 1
            rendered = render_table(table_lines)
            if rendered:
                out.append(rendered)
            continue

        if line.startswith("> "):
            flush_paragraph(out, paragraph)
            flush_list(out, list_items, list_ordered)
            quote_lines = []
            while index < len(lines) and lines[index].startswith("> "):
                quote_lines.append(lines[index][2:].strip())
                index += 1
            out.append(f"<blockquote><p>{inline(' '.join(quote_lines))}</p></blockquote>")
            continue

        unordered = re.match(r"^-\s+(.+)$", line)
        ordered = re.match(r"^\d+\.\s+(.+)$", line)
        if unordered or ordered:
            flush_paragraph(out, paragraph)
            is_ordered = bool(ordered)
            if list_items and list_ordered != is_ordered:
                flush_list(out, list_items, list_ordered)
            list_ordered = is_ordered
            list_items.append((ordered or unordered).group(1).strip())
            index += 1
            continue

        flush_list(out, list_items, list_ordered)
        paragraph.append(line.strip())
        index += 1

    flush_paragraph(out, paragraph)
    flush_list(out, list_items, list_ordered)
    return "\n".join(out), toc


def build_page() -> None:
    source_text = SOURCE.read_text(encoding="utf-8")
    source_body = source_text.split("\n## Nota De Transparência Sobre Uso De IA", 1)[0].rstrip()
    body, toc = markdown_to_html(source_body)
    toc_html = "\n".join(f'<a href="#{item_id}">{inline(label)}</a>' for item_id, label in toc)
    quiz_json = json.dumps(QUIZ, ensure_ascii=False, indent=2)
    discursive_json = json.dumps(DISCURSIVE, ensure_ascii=False, indent=2)

    page = f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Módulo 1 - Dignidade, Princípios e Efetividade Constitucional | Direitos Fundamentais</title>
  <link rel="stylesheet" href="../../assets/style.css">
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="brand">
        <strong>Prof. Mario Bastos</strong>
        <span>Direito Constitucional</span>
      </div>
      <nav aria-label="Navegação principal">
        <a href="../../">Início</a>
        <a href="../">Direitos Fundamentais</a>
        <a href="../../documentos-institucionais/">Documentos e leituras</a>
        <a href="../../privacidade.html">Privacidade</a>
      </nav>
    </div>
  </header>

  <main class="module-page">
    <section class="hero compact-hero">
      <span class="tag">Aula 01 · I Unidade</span>
      <h1>Módulo 1 - Dignidade, Princípios e Efetividade Constitucional</h1>
      <p>Material de apoio para leitura guiada sobre dignidade da pessoa humana, princípios fundamentais, direitos fundamentais e efetividade constitucional.</p>
    </section>

    <section class="notice">
      <strong>Como estudar:</strong> leia primeiro o problema central, depois acompanhe os tópicos em sequência. Ao final, responda às questões de treino e use o feedback como guia de revisão.
    </section>

    <section>
      <h2>Leituras Do Módulo</h2>
      <div class="reading-list">
        <article class="reading-item">
          <span class="tag">PDF aberto</span>
          <h3>Barroso - Neoconstitucionalismo e constitucionalização do Direito</h3>
          <p>Leitura complementar obrigatória para compreender o contexto do neoconstitucionalismo, a força normativa da Constituição e a constitucionalização do Direito. Publicado na Revista Quaestio Iuris, com licença CC-BY 4.0.</p>
          <a href="../leituras/barroso-neoconstitucionalismo-constitucionalizacao-direito.pdf">Baixar PDF</a>
        </article>
        <article class="reading-item">
          <span class="tag">Referência central</span>
          <h3>Barroso - A dignidade da pessoa humana no direito constitucional contemporâneo</h3>
          <p>Fonte central deste módulo. O PDF integral da obra não é hospedado publicamente nesta página sem confirmação de licença ou autorização específica de disponibilização.</p>
        </article>
      </div>
    </section>

    <div class="module-layout">
      <aside class="toc-card" aria-label="Sumário do módulo">
        <h2>Sumário</h2>
        <nav class="toc-links" aria-label="Seções do módulo">
          {toc_html}
        </nav>
      </aside>

      <article class="module-content">
        {body}

        <section class="quiz-panel" aria-labelledby="treino-final">
          <h2 id="treino-final">Treino Final Do Módulo</h2>
          <p>As questões abaixo servem para revisar o conteúdo. A correção das objetivas acontece no próprio navegador. Depois da correção, o estudante pode abrir um formulário Google pré-preenchido ou preparar um e-mail para o professor.</p>
          <form id="moduleQuiz">
            <section class="submission-panel" aria-label="Identificação para envio">
              <h3>Identificação para envio</h3>
              <div class="field-grid">
                <label>
                  Nome
                  <input id="moduleStudentName" type="text" autocomplete="name" placeholder="Nome completo">
                </label>
                <label>
                  E-mail
                  <input id="moduleStudentEmail" type="email" autocomplete="email" placeholder="nome@email.com">
                </label>
                <label>
                  Turma
                  <input id="moduleStudentGroup" type="text" value="3º semestre - Direitos Fundamentais">
                </label>
              </div>
            </section>
            <div id="objectiveTraining" class="question-list"></div>
            <div id="discursiveTraining" class="question-list"></div>
            <div class="actions-panel">
              <button type="submit" class="primary-button">Corrigir objetivas</button>
              <button type="button" id="clearQuiz" class="secondary-button">Limpar respostas</button>
            </div>
          </form>
          <section id="trainingResult" class="results-panel" hidden aria-live="polite">
            <h3>Resultado do treino</h3>
            <div id="trainingSummary" class="score-summary"></div>
            <div id="trainingFeedback" class="feedback-list"></div>
            <div class="actions-panel">
              <button type="button" id="copyTrainingReport" class="primary-button">Copiar relatório</button>
              <button type="button" id="sendTrainingReport" class="secondary-button">Enviar ao professor</button>
            </div>
            <p id="trainingSubmissionStatus" class="helper-text" aria-live="polite">Contato do professor: <a href="mailto:mario.bastos.adv@gmail.com">mario.bastos.adv@gmail.com</a>.</p>
            <textarea id="trainingReport" class="report-box" readonly aria-label="Relatório de estudo"></textarea>
          </section>
        </section>

        <section class="ai-disclosure" aria-labelledby="nota-ia">
          <h2 id="nota-ia">Nota De Transparência Sobre Uso De IA</h2>
          <p>{html.escape(AI_NOTICE)}</p>
        </section>
      </article>
    </div>
  </main>

  <footer class="site-footer">
    Material de apoio da disciplina Direito Constitucional - Direitos Fundamentais e Organização do Estado.
  </footer>

  <script src="../../assets/submission-config.js"></script>
  <script>
    const objectiveQuestions = {quiz_json};
    const discursiveQuestion = {discursive_json};
    const activityTitle = "Treino Final - Módulo 1: Dignidade, Princípios e Efetividade Constitucional";
    const disciplineTitle = "Direito Constitucional - Direitos Fundamentais e Organização do Estado";
    let latestModuleSubmission = null;

    function optionHtml(question) {{
      return Object.entries(question.options).map(([key, value]) => `
        <label class="option-row">
          <input type="radio" name="${{question.id}}" value="${{key}}">
          <span><strong>${{key}}.</strong> ${{value}}</span>
        </label>
      `).join("");
    }}

    function renderQuiz() {{
      const objectiveRoot = document.getElementById("objectiveTraining");
      const discursiveRoot = document.getElementById("discursiveTraining");
      objectiveRoot.innerHTML = objectiveQuestions.map((question) => `
        <fieldset class="question-card">
          <legend><strong>${{question.title}}</strong></legend>
          <p>${{question.prompt}}</p>
          <div class="options-list">${{optionHtml(question)}}</div>
        </fieldset>
      `).join("");

      discursiveRoot.innerHTML = `
        <article class="question-card">
          <h3>${{discursiveQuestion.title}}</h3>
          <p>${{discursiveQuestion.prompt}}</p>
          <label>
            Esboço da resposta
            <textarea id="${{discursiveQuestion.id}}" placeholder="Escreva uma resposta curta com conceito, dispositivo, aplicação e conclusão."></textarea>
          </label>
          <div class="rubric-box">
            <strong>Roteiro de autocorreção</strong>
            ${{discursiveQuestion.rubric.map((item) => `<label class="check-row"><input type="checkbox"> <span>${{item}}</span></label>`).join("")}}
            <p><strong>Fonte:</strong> ${{discursiveQuestion.source}}</p>
          </div>
        </article>
      `;
    }}

    function selectedValue(id) {{
      const selected = document.querySelector(`input[name="${{id}}"]:checked`);
      return selected ? selected.value : "";
    }}

    function buildReport(score, feedback) {{
      const name = document.getElementById("moduleStudentName").value.trim() || "Sem identificação";
      const email = document.getElementById("moduleStudentEmail").value.trim() || "Sem e-mail informado";
      const group = document.getElementById("moduleStudentGroup").value.trim() || "Sem turma/contexto";
      const discursiveAnswer = document.getElementById(discursiveQuestion.id).value.trim() || "Sem resposta.";
      const lines = [
        "# Relatório de treino - Módulo 1",
        "",
        `- Estudante: ${{name}}`,
        `- E-mail: ${{email}}`,
        `- Turma/contexto: ${{group}}`,
        `- Disciplina: ${{disciplineTitle}}`,
        `- Atividade: ${{activityTitle}}`,
        `Resultado objetivo: ${{score}}/${{objectiveQuestions.length}}`,
        "",
        "## Questões objetivas"
      ];
      feedback.forEach((item) => {{
        lines.push("");
        lines.push(`### ${{item.title}}`);
        lines.push(`Resposta marcada: ${{item.selected || "não respondida"}}`);
        lines.push(`Gabarito: ${{item.answer}}`);
        lines.push(`Resultado: ${{item.correct ? "correta" : "incorreta"}}`);
        lines.push(`Comentário: ${{item.comment}}`);
        lines.push(`Fonte: ${{item.source}}`);
      }});
      lines.push("");
      lines.push("## Questão discursiva");
      lines.push(discursiveQuestion.prompt);
      lines.push("");
      lines.push("### Resposta escrita");
      lines.push(discursiveAnswer);
      lines.push("");
      lines.push("### Roteiro de autocorreção");
      discursiveQuestion.rubric.forEach((item) => lines.push(`- ${{item}}`));
      lines.push("");
      lines.push(`Fonte: ${{discursiveQuestion.source}}`);
      return lines.join("\\n");
    }}

    function getSubmissionConfig() {{
      return window.DC_SUBMISSION_CONFIG || {{
        professorEmail: "mario.bastos.adv@gmail.com",
        googleForm: {{ enabled: false, prefillUrl: "", entries: {{}} }}
      }};
    }}

    function truncateForForm(value, limit = 7800) {{
      if (!value || value.length <= limit) return value || "";
      return `${{value.slice(0, limit)}}\\n\\n[Relatório truncado para caber no formulário. Use o botão "Copiar relatório" para preservar a versão integral.]`;
    }}

    function objectiveSummary(feedback) {{
      return feedback.map((item) => {{
        const status = item.correct ? "correta" : "incorreta";
        return `${{item.title}}: marcada ${{item.selected || "sem resposta"}}; gabarito ${{item.answer}}; ${{status}}`;
      }}).join("\\n");
    }}

    function buildSubmissionPayload(score, feedback, reportText) {{
      const name = document.getElementById("moduleStudentName").value.trim() || "Sem identificação";
      const email = document.getElementById("moduleStudentEmail").value.trim() || "Sem e-mail informado";
      const group = document.getElementById("moduleStudentGroup").value.trim() || "Sem turma/contexto";
      const discursiveAnswer = document.getElementById(discursiveQuestion.id).value.trim() || "Sem resposta.";
      return {{
        student: name,
        email,
        group,
        discipline: disciplineTitle,
        activity: activityTitle,
        scoreText: `${{score}} / ${{objectiveQuestions.length}} objetivas`,
        objectiveAnswers: objectiveSummary(feedback),
        discursiveAnswer,
        reportText
      }};
    }}

    function buildPrefilledGoogleFormUrl(payload) {{
      const config = getSubmissionConfig().googleForm || {{}};
      if (!config.enabled || !config.prefillUrl || !config.entries) return "";

      const url = new URL(config.prefillUrl);
      const fields = {{
        nome: payload.student,
        email: payload.email,
        turma: payload.group,
        disciplina: payload.discipline,
        atividade: payload.activity,
        acertos: payload.scoreText,
        respostasObjetivas: payload.objectiveAnswers,
        respostaDiscursiva: payload.discursiveAnswer,
        relatorio: truncateForForm(payload.reportText)
      }};

      Object.entries(fields).forEach(([key, value]) => {{
        const entryId = config.entries[key];
        if (entryId) url.searchParams.set(entryId, value);
      }});

      return url.toString();
    }}

    function openSubmissionTarget(payload) {{
      const status = document.getElementById("trainingSubmissionStatus");
      const formUrl = buildPrefilledGoogleFormUrl(payload);
      if (formUrl) {{
        window.open(formUrl, "_blank", "noopener");
        status.innerHTML = "Formulário Google aberto em nova aba. Confira os dados e clique em enviar no próprio formulário.";
        return;
      }}

      const config = getSubmissionConfig();
      const subject = encodeURIComponent(`Relatório de treino - ${{payload.discipline}}`);
      const body = encodeURIComponent(payload.reportText.slice(0, 1800));
      window.location.href = `mailto:${{config.professorEmail}}?subject=${{subject}}&body=${{body}}`;
      status.innerHTML = `Google Forms ainda não configurado. Foi preparado um e-mail para <a href="mailto:${{config.professorEmail}}">${{config.professorEmail}}</a>; para enviar o relatório completo, use também "Copiar relatório".`;
    }}

    document.getElementById("moduleQuiz").addEventListener("submit", (event) => {{
      event.preventDefault();
      const feedback = objectiveQuestions.map((question) => {{
        const selected = selectedValue(question.id);
        const correct = selected === question.answer;
        return {{
          title: question.title,
          selected,
          answer: question.answer,
          correct,
          comment: selected ? question.feedback[selected] : "Sem resposta marcada. Revise o enunciado e tente justificar por que uma alternativa seria correta.",
          source: question.source
        }};
      }});

      const score = feedback.filter((item) => item.correct).length;
      document.getElementById("trainingSummary").innerHTML = `
        <div><span>Acertos</span><strong>${{score}} de ${{objectiveQuestions.length}}</strong></div>
        <div><span>Próximo passo</span><strong>${{score === objectiveQuestions.length ? "Revisar discursiva" : "Rever explicações"}}</strong></div>
      `;
      document.getElementById("trainingFeedback").innerHTML = feedback.map((item) => `
        <article class="feedback-card ${{item.correct ? "is-correct" : "is-wrong"}}">
          <h4>${{item.title}}</h4>
          <p><strong>Resultado:</strong> ${{item.correct ? "correta" : "incorreta"}}</p>
          <p><strong>Sua resposta:</strong> ${{item.selected || "não respondida"}} · <strong>Gabarito:</strong> ${{item.answer}}</p>
          <p><strong>Por quê:</strong> ${{item.comment}}</p>
          <p><strong>Fonte:</strong> ${{item.source}}</p>
        </article>
      `).join("");
      const reportText = buildReport(score, feedback);
      document.getElementById("trainingReport").value = reportText;
      latestModuleSubmission = buildSubmissionPayload(score, feedback, reportText);
      document.getElementById("trainingResult").hidden = false;
    }});

    document.getElementById("copyTrainingReport").addEventListener("click", async () => {{
      const reportText = document.getElementById("trainingReport").value;
      if (!reportText) return;
      await navigator.clipboard.writeText(reportText);
      document.getElementById("copyTrainingReport").textContent = "Relatório copiado";
      setTimeout(() => document.getElementById("copyTrainingReport").textContent = "Copiar relatório", 1800);
    }});

    document.getElementById("sendTrainingReport").addEventListener("click", () => {{
      if (!latestModuleSubmission) {{
        document.getElementById("trainingSubmissionStatus").textContent = "Corrija o treino antes de enviar o relatório.";
        return;
      }}
      openSubmissionTarget(latestModuleSubmission);
    }});

    document.getElementById("clearQuiz").addEventListener("click", () => {{
      document.getElementById("moduleQuiz").reset();
      document.getElementById("trainingResult").hidden = true;
      document.getElementById("trainingReport").value = "";
      latestModuleSubmission = null;
      document.getElementById("trainingSubmissionStatus").innerHTML = "Contato do professor: <a href=\\"mailto:mario.bastos.adv@gmail.com\\">mario.bastos.adv@gmail.com</a>.";
    }});

    renderQuiz();
  </script>
</body>
</html>
"""
    TARGET.write_text(page, encoding="utf-8")


if __name__ == "__main__":
    build_page()
