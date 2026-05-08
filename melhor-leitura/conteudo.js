// ============================================================
// melhor-leitura/conteudo.js
// Alt+Clique em qualquer elemento → exibe texto em box de alto contraste
// Configurações lidas do storage.local do PJE Play
// ============================================================

(() => {
  const STORAGE_KEY = 'melhorLeitura_config';

  const DEFAULTS = {
    bgColor:   '#000000',
    textColor: '#ffdd00',
    fontSize:  22,
    boxWidth:  480,
  };

  let config = { ...DEFAULTS };

  const NAV = (typeof browser !== 'undefined') ? browser : chrome;

  function carregarConfig() {
    NAV.storage.local.get(STORAGE_KEY).then(result => {
      if (result[STORAGE_KEY]) config = { ...DEFAULTS, ...result[STORAGE_KEY] };
    }).catch(() => {});
  }

  carregarConfig();

  NAV.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]) {
      config = { ...DEFAULTS, ...changes[STORAGE_KEY].newValue };
    }
  });

  // ── Overlay ────────────────────────────────────────────────
  function obterOverlay() {
    let overlay = document.getElementById('__ml_overlay__');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = '__ml_overlay__';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.01);
      `;
      overlay.addEventListener('click', fechar);
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function exibir(texto) {
    const overlay = obterOverlay();
    overlay.style.display = 'flex';
    overlay.innerHTML = '';

    const box = document.createElement('div');
    box.id = '__ml_box__';
    box.style.cssText = `
      background: ${config.bgColor};
      color: ${config.textColor};
      font-size: ${config.fontSize}px;
      font-family: system-ui, sans-serif;
      font-weight: 600;
      line-height: 1.5;
      padding: 28px 36px;
      border-radius: 12px;
      max-width: ${config.boxWidth}px;
      max-height: 80vh;
      overflow-y: auto;
      width: 90vw;
      box-shadow: 0 8px 40px rgba(0,0,0,0.7);
      white-space: pre-wrap;
      word-break: break-word;
      text-align: center;
      position: relative;
      cursor: default;
      animation: __ml_fade_in__ 0.15s ease;
    `;

    const btnFechar = document.createElement('button');
    btnFechar.textContent = '✕';
    btnFechar.style.cssText = `
      position: absolute;
      top: 10px;
      right: 14px;
      background: transparent;
      border: none;
      color: ${config.textColor};
      font-size: ${Math.max(16, config.fontSize * 0.7)}px;
      cursor: pointer;
      opacity: 0.7;
      line-height: 1;
      padding: 0;
    `;
    btnFechar.addEventListener('click', fechar);

    const conteudo = document.createElement('div');
    conteudo.style.marginTop = '8px';
    conteudo.textContent = texto;

    box.addEventListener('click', e => e.stopPropagation());
    box.appendChild(btnFechar);
    box.appendChild(conteudo);
    overlay.appendChild(box);

    if (!document.getElementById('__ml_style__')) {
      const style = document.createElement('style');
      style.id = '__ml_style__';
      style.textContent = `
        @keyframes __ml_fade_in__ {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function fechar() {
    const overlay = document.getElementById('__ml_overlay__');
    if (overlay) overlay.style.display = 'none';
  }

  // ── Extração de texto ──────────────────────────────────────
  function extrairTexto(el) {
    let texto = (
      el.innerText?.trim() ||
      el.textContent?.trim() ||
      el.getAttribute('title') ||
      el.getAttribute('placeholder') ||
      el.getAttribute('alt') ||
      el.getAttribute('aria-label') ||
      el.value ||
      ''
    ).trim();

    // Se não achou, sobe até 5 níveis na árvore
    if (!texto) {
      let pai = el.parentElement;
      let nivel = 0;
      while (pai && nivel < 5) {
        texto = (
          pai.innerText?.trim() ||
          pai.textContent?.trim() ||
          pai.getAttribute('title') ||
          pai.getAttribute('placeholder') ||
          pai.getAttribute('alt') ||
          pai.getAttribute('aria-label') ||
          pai.value ||
          ''
        ).trim();
        if (texto) break;
        pai = pai.parentElement;
        nivel++;
      }
    }

    return texto || '(sem texto)';
  }

  // ── Listener principal ─────────────────────────────────────
  document.addEventListener('click', e => {
    if (!e.altKey) return;
    e.preventDefault();
    e.stopPropagation();

    NAV.storage.local.get(STORAGE_KEY).then(result => {
      if (result[STORAGE_KEY]) config = { ...DEFAULTS, ...result[STORAGE_KEY] };
      exibir(extrairTexto(e.target));
    }).catch(() => {
      exibir(extrairTexto(e.target));
    });
  }, true);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fechar();
  });

})();