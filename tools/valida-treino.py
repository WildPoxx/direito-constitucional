#!/usr/bin/env python3
# Replica as expressoes regulares de module-renderer.js (extrairTreino)
# para conferir, antes de publicar, se TODAS as questoes do bloco ## Treino
# serao lidas pelo renderizador. Questao mal formatada e descartada em silencio.
import re, sys

def valida(path):
    md = open(path, encoding='utf-8').read()
    problemas = []
    inicio = md.find('## Treino')
    if inicio < 0:
        return ['FATAL: nao existe bloco "## Treino" no arquivo.'], []
    resto = md[inicio + len('## Treino'):]
    m_fim = re.search(r'\n#{2,3} (?!#)', resto)
    bloco = resto[:m_fim.start()] if m_fim else resto
    if not m_fim:
        problemas.append('AVISO: o bloco Treino vai ate o fim do arquivo (nenhum cabecalho de 2 ou 3 # depois).')

    partes = re.split(r'\n#### +', bloco)[1:]
    if not partes:
        problemas.append('FATAL: nenhuma questao (#### Questao N - Titulo) encontrada dentro do bloco.')
        return problemas, []

    lidas = []
    for i, parte in enumerate(partes, 1):
        titulo = parte.split('\n')[0].strip()
        corpo = parte[parte.index('\n') + 1:] if '\n' in parte else ''
        rot = f'Q{i} "{titulo}"'

        mr = re.search(r'\*\*Resposta:\s*([A-D])\.\*\*', corpo)
        if not mr:
            problemas.append(f'{rot}: DESCARTADA - falta a marca **Resposta: X.**')
            continue
        antes = corpo[:mr.start()]
        depois = corpo[mr.end():]

        ma = re.search(r'\n\*\*A\.\*\*', antes)
        if not ma:
            problemas.append(f'{rot}: DESCARTADA - nao ha linha iniciando por **A.** antes da resposta.')
            continue

        alts = re.findall(r'\*\*([A-D])\.\*\*\s*([\s\S]*?)(?=\n\s*\n\*\*[A-D]\.\*\*|\Z)',
                          antes[ma.start():])
        if len(alts) != 4:
            letras = ''.join(a[0] for a in alts) or '(nenhuma)'
            problemas.append(f'{rot}: DESCARTADA - {len(alts)} alternativas lidas [{letras}] em vez de 4. '
                             f'Confira a linha em branco obrigatoria entre elas.')
            continue
        if [a[0] for a in alts] != ['A', 'B', 'C', 'D']:
            problemas.append(f'{rot}: alternativas fora de ordem: {[a[0] for a in alts]}')

        por_alt = dict(re.findall(r'(?m)^- \*\*([A-D])\*\*\s*([\s\S]*?)(?=\n- \*\*[A-D]\*\*|\Z)', depois))
        correta = mr.group(1)
        esperadas = {l for l in 'ABCD' if l != correta}
        faltando = esperadas - set(por_alt)
        if faltando:
            problemas.append(f'{rot}: sem comentario "- **X**" para {sorted(faltando)}')
        if correta in por_alt:
            problemas.append(f'{rot}: ha comentario "- **{correta}**" para a alternativa CORRETA; '
                             f'o renderizador o trata como razao de erro.')
        geral = re.split(r'\n- \*\*[A-D]\*\*', depois)[0].strip()
        if not geral:
            problemas.append(f'{rot}: sem comentario geral apos a marca de resposta.')
        for l, txt in por_alt.items():
            if re.match(r'(?i)^\s*est[aá]\s+errad', txt) or re.match(r'(?i)^\s*porque\b', txt):
                problemas.append(f'{rot}: comentario da {l} comeca por formula ("esta errada"/"porque"); '
                                 f'o renderizador ja prefixa a frase.')
        lidas.append((i, titulo, correta))
    return problemas, lidas

if __name__ == '__main__':
    for path in sys.argv[1:]:
        print(f'\n===== {path} =====')
        problemas, lidas = valida(path)
        print(f'Questoes lidas pelo renderizador: {len(lidas)}')
        for i, t, c in lidas:
            print(f'  {i:>2}. [{c}] {t}')
        if lidas:
            from collections import Counter
            dist = Counter(c for _, _, c in lidas)
            print('  Distribuicao de gabaritos:', dict(sorted(dist.items())))
            excesso = [l for l, n in dist.items() if n > 3]
            if excesso:
                problemas.append(f'Gabaritos concentrados: {excesso} aparece(m) mais de 3 vezes em 10.')
        print(f'\nProblemas: {len(problemas)}')
        for p in problemas:
            print('  -', p)
        if len(lidas) == 0:
            print('\n>>> BLOCO INTEIRO FALHARIA: viraria <div class="module-quiz-slot" data-falha="1">')
