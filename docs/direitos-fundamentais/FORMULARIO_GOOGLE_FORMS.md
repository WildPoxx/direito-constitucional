# Configuração de envio por Google Forms

Este guia registra o padrão de envio de respostas dos exercícios interativos da disciplina **Direito Constitucional - Direitos Fundamentais e Organização do Estado**.

Professor responsável: Mario Bastos  
E-mail de contato: <mario.bastos.adv@gmail.com>

## Modelo adotado

As páginas do site corrigem as questões objetivas no próprio navegador. Depois da correção, o botão **Enviar ao professor** tenta abrir um Google Form pré-preenchido com os dados do relatório. O estudante deve revisar as informações no formulário e clicar em enviar.

Se o Google Form ainda não estiver configurado, o botão prepara um e-mail para o professor e orienta o estudante a copiar o relatório completo.

## Campos recomendados no Google Form

Crie um Google Form com os seguintes campos, preferencialmente nesta ordem:

1. Nome
2. E-mail
3. Turma
4. Disciplina
5. Atividade
6. Acertos ou pontuação
7. Respostas objetivas
8. Resposta discursiva
9. Relatório completo

Sugestões:

- Use campo de resposta curta para nome, e-mail, turma, disciplina, atividade e acertos.
- Use parágrafo para respostas objetivas, resposta discursiva e relatório completo.
- Não colete senha dos alunos. Se precisar de identificação mais segura, use a opção nativa do Google Forms para coletar e-mail.
- Vincule as respostas a uma planilha Google Sheets para análise posterior.

## Como gerar o link pré-preenchido

1. Abra o Google Form como editor.
2. No menu de três pontos, use a opção de obter link pré-preenchido.
3. Preencha cada campo com um valor fácil de reconhecer, como `NOME_TESTE`, `EMAIL_TESTE` e `RELATORIO_TESTE`.
4. Gere o link pré-preenchido.
5. Copie o link.
6. No link, identifique os parâmetros no formato `entry.123456789=VALOR_TESTE`.
7. Copie cada `entry.123456789` para o arquivo `docs/assets/submission-config.js`.

## Arquivo de configuração

Depois de criar o formulário, edite:

`docs/assets/submission-config.js`

Exemplo de preenchimento:

```js
window.DC_SUBMISSION_CONFIG = {
  professorEmail: "mario.bastos.adv@gmail.com",
  googleForm: {
    enabled: true,
    prefillUrl: "https://docs.google.com/forms/d/e/SEU_FORM_ID/viewform?usp=pp_url",
    entries: {
      nome: "entry.111111111",
      email: "entry.222222222",
      turma: "entry.333333333",
      disciplina: "entry.444444444",
      atividade: "entry.555555555",
      acertos: "entry.666666666",
      respostasObjetivas: "entry.777777777",
      respostaDiscursiva: "entry.888888888",
      relatorio: "entry.999999999"
    }
  }
};
```

Enquanto `enabled` estiver como `false`, o site não abrirá Google Form e usará o e-mail como fallback.

## Fontes técnicas

- Google Developers. **Forms Service - Apps Script**. Documentação oficial sobre criação e manipulação de Google Forms por Apps Script.
- Google Developers. **Web Apps - Apps Script**. Documentação oficial sobre publicação de scripts com `doGet(e)` e `doPost(e)`.

## Nota de transparência sobre uso de IA

Este material fez uso de Inteligência Artificial Generativa (ChatGPT, modelo 5.5, e Claude Anthropic, modelo Alps 5.0) para organização e estruturação do texto, revisão de redação e estilo e preparação visual ou adaptação didática, observadas as diretrizes da Portaria CNPq nº 2.664/2026. A seleção do conteúdo, a conferência das fontes e a responsabilidade final são do docente responsável.
