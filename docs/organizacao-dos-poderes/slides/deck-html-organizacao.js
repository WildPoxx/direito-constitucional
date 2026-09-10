(() => {
  const slides = [...document.querySelectorAll('.slide')];
  let current = 0;
  const hud = {
    slide: document.getElementById('hud-slide'),
    target: document.getElementById('hud-alvo'),
    now: document.getElementById('hud-agora'),
    delta: document.getElementById('hud-delta')
  };
  const visible = () => slides.filter((slide) => slide.offsetParent !== null);
  const clockMinutes = (text) => {
    const match = String(text || '').match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };

  // Desenha o painel de tempo. Nunca move a pagina.
  const renderHud = () => {
    const list = visible();
    if (!list.length) return;
    current = Math.max(0, Math.min(current, list.length - 1));
    const active = list[current];
    if (hud.slide) hud.slide.textContent = active.dataset.slide || `${current + 1}/${list.length}`;
    const target = active.dataset.alvo || '--:--';
    if (hud.target) hud.target.textContent = target;
    const now = new Date();
    if (hud.now) hud.now.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const targetMinutes = clockMinutes(target);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (hud.delta && targetMinutes !== null) {
      const difference = nowMinutes - targetMinutes;
      hud.delta.textContent = difference === 0 ? 'em dia' : difference > 0 ? `+${difference} min` : `${difference} min`;
      hud.delta.classList.toggle('late', difference > 2);
      hud.delta.classList.toggle('ahead', difference < -2);
    }
  };

  // Move a pagina ate uma lamina e redesenha o painel.
  // Enquanto a rolagem suave acontece, o indice fica travado: senao o
  // observador de rolagem leria posicoes intermediarias e puxaria de volta.
  let lockUntil = 0;
  const goTo = (index, behavior = 'smooth') => {
    const list = visible();
    if (!list.length) return;
    current = Math.max(0, Math.min(index, list.length - 1));
    lockUntil = Date.now() + 800;
    list[current].scrollIntoView({ behavior, block: 'start' });
    renderHud();
  };

  // Rolagem manual (roda do mouse, barra, toque) manda no indice.
  let queued = false;
  const syncFromScroll = () => {
    if (Date.now() < lockUntil) return;
    const list = visible();
    if (!list.length) return;
    const mark = window.innerHeight * 0.35;
    let index = 0;
    list.forEach((slide, i) => { if (slide.getBoundingClientRect().top <= mark) index = i; });
    if (index !== current) { current = index; renderHud(); }
  };
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => { queued = false; syncFromScroll(); });
  }, { passive: true });

  // Troca de marcas sem perder o lugar da aula.
  const keepPlace = (change) => {
    const anchor = visible()[current];
    change();
    const list = visible();
    if (!list.length) return;
    const found = list.indexOf(anchor);
    goTo(found >= 0 ? found : Math.min(current, list.length - 1), 'auto');
  };

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (['arrowright', 'arrowdown', 'pagedown', ' '].includes(key)) { event.preventDefault(); goTo(current + 1); }
    else if (['arrowleft', 'arrowup', 'pageup'].includes(key)) { event.preventDefault(); goTo(current - 1); }
    else if (key === 'home') { event.preventDefault(); goTo(0); }
    else if (key === 'end') { event.preventDefault(); goTo(visible().length - 1); }
    else if (key === 'g') { document.body.classList.toggle('mostrar-gabarito'); }
    else if (key === 'n') { document.body.classList.toggle('mostrar-notas'); }
    else if (key === 'o') { keepPlace(() => document.body.classList.toggle('hide-optional')); }
    else if (key === 'm') {
      keepPlace(() => {
        document.body.classList.remove('mostrar-gabarito', 'mostrar-notas', 'hide-optional');
        document.body.classList.add('sem-marcas');
      });
    }
    else if (key === 'h') { document.body.classList.toggle('hud-off'); }
    else if (key === 'f') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }
  });

  // O relogio se atualiza sozinho; a pagina fica onde o professor deixou.
  window.setInterval(renderHud, 30000);
  window.addEventListener('resize', renderHud);
  renderHud();
})();
