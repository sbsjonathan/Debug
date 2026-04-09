document.addEventListener("DOMContentLoaded", () => {
    const menuContainer = document.getElementById('menu-container');
    const diaElemento = document.querySelector('.dia');

    if (!menuContainer || !diaElemento) {
        return;
    }

    const fonteStorageKey = 'tamanho-fonte-global';
    const FONTE_PADRAO = 16;
    const FONTE_MIN = FONTE_PADRAO;
    const FONTE_MAX = FONTE_PADRAO + 10;
    const GLOW_CINZA = 'rgba(180,180,185,0.15)';
    const DEFAULT_DAY_COLORS = {
      sex: '#4f73c3',
      sab: '#c63d3d',
      dom: '#7b4bb3'
    };

    function systemProgramDay() {
      const hoje = new Date().getDay();
      if (hoje === 6) return 'sab';
      if (hoje === 0) return 'dom';
      return 'sex';
    }

    function getHashDay() {
      const raw = (location.hash || '').replace('#', '').trim().toLowerCase();
      return['sex', 'sab', 'dom'].includes(raw) ? raw : null;
    }

    function getActiveDay() {
      return getHashDay() || systemProgramDay();
    }

    function getColorStorageKey(day) {
      return `cor-${day}`;
    }

    function getDefaultColor(day) {
      return DEFAULT_DAY_COLORS[day] || DEFAULT_DAY_COLORS.sex;
    }

    function getSavedColor(day) {
      return localStorage.getItem(getColorStorageKey(day)) || getDefaultColor(day);
    }

    function applyColorForDay(day) {
      const color = getSavedColor(day);
      document.documentElement.dataset.programDay = day;
      document.documentElement.style.setProperty('--cor-global', color);
      if (corPicker) corPicker.value = color;
      if (menuVisivel) aplicarGlowDaCorGlobal();
      else resetarGlowPadrao();
    }

    document.documentElement.style.setProperty('--cor-glow', GLOW_CINZA);

    menuContainer.innerHTML = `
      <div id="controles" style="display: none;">
        <div class="controle-grupo">
          <label>Aparência</label>
          <div class="segmented-control">
            <input type="radio" name="tema" id="theme-system" value="system" checked>
            <input type="radio" name="tema" id="theme-light" value="light">
            <input type="radio" name="tema" id="theme-dark" value="dark">
            <label for="theme-system">Sistema</label>
            <label for="theme-light">Claro</label>
            <label for="theme-dark">Escuro</label>
            <div class="segmented-slider"></div>
          </div>
        </div>
        <div class="controle-grupo">
          <label for="cor-picker">Cor do Dia</label>
          <div class="controle-acoes">
            <input type="color" id="cor-picker" title="Escolha a cor de destaque do dia">
          </div>
        </div>
        <div class="controle-grupo controle-grupo-fonte">
          <label for="range-tamanho-fonte">Tamanho do Texto</label>
          <div class="controle-fonte">
            <div class="controle-fonte-topo" aria-hidden="true">
              <span class="fonte-preview fonte-preview-menor">A</span>
              <span class="fonte-preview fonte-preview-maior">A</span>
            </div>
            <div class="range-shell">
              <span class="range-linha" aria-hidden="true"></span>
              <span class="range-ticks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
              <input type="range" id="range-tamanho-fonte" min="16" max="26" step="1" value="16" aria-label="Ajustar tamanho global do texto">
            </div>
          </div>
        </div>
        <div class="controle-grupo">
          <label>Configurações</label>
          <div class="controle-acoes">
            <button id="btn-limpar-cache" title="Apaga todas as cores e fontes salvas">Limpar Preferências</button>
          </div>
        </div>
      </div>
    `;

    const menuControles = document.getElementById('controles');
    const corPicker = document.getElementById('cor-picker');
    const rangeTamanhoFonte = document.getElementById('range-tamanho-fonte');
    const btnLimparCache = document.getElementById('btn-limpar-cache');
    const themeRadios = document.querySelectorAll('input[name="tema"]');

    let menuVisivel = false;

    function aplicarGlowDaCorGlobal() {
      const corGlobal = getComputedStyle(document.documentElement).getPropertyValue('--cor-global').trim();
      let glow;
      if (corGlobal.startsWith('#')) {
        const hex = corGlobal.slice(1);
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        glow = `rgba(${r},${g},${b},0.18)`;
      } else if (corGlobal.startsWith('rgb')) {
        const [r,g,b] = corGlobal.replace(/[^\d,]/g, '').split(',').map(n => n.trim());
        glow = `rgba(${r},${g},${b},0.18)`;
      } else {
        glow = GLOW_CINZA;
      }
      document.documentElement.style.setProperty('--cor-glow', glow);
    }

    function resetarGlowPadrao() {
      document.documentElement.style.setProperty('--cor-glow', GLOW_CINZA);
    }

    const prefersDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');
    
    function applyThemeToDOM(themeVal) {
      let isDark = false;
      if (themeVal === 'dark') {
        isDark = true;
      } else if (themeVal === 'system' && prefersDarkMedia.matches) {
        isDark = true;
      }
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.documentElement.dataset.themeChoice = themeVal;
    }

    function initTheme() {
      const savedTheme = localStorage.getItem('tema-interface') || 'system';
      const radio = document.querySelector(`input[name="tema"][value="${savedTheme}"]`);
      if (radio) radio.checked = true;
      applyThemeToDOM(savedTheme);
    }

    prefersDarkMedia.addEventListener('change', () => {
      const currentTheme = localStorage.getItem('tema-interface') || 'system';
      if (currentTheme === 'system') {
        applyThemeToDOM('system');
      }
    });

    themeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        localStorage.setItem('tema-interface', selectedTheme);
        applyThemeToDOM(selectedTheme);
      });
    });

    function carregarPreferencias() {
      applyColorForDay(getActiveDay());
      initTheme();
      const tamanhoFonteSalvo = Math.min(FONTE_MAX, Math.max(FONTE_MIN, parseInt(localStorage.getItem(fonteStorageKey) || FONTE_PADRAO, 10) || FONTE_PADRAO));
      document.documentElement.style.setProperty('--tamanho-fonte', `${tamanhoFonteSalvo}px`);
      document.documentElement.style.setProperty('--font-base-global', `${tamanhoFonteSalvo}px`);
      document.documentElement.style.setProperty('--font-scale-global', String(tamanhoFonteSalvo / FONTE_PADRAO));
      if (rangeTamanhoFonte) {
        rangeTamanhoFonte.value = String(tamanhoFonteSalvo);
        atualizarRangeVisual(tamanhoFonteSalvo);
      }
    }

    function atualizarRangeVisual(valorAtual) {
      const percentual = ((valorAtual - FONTE_MIN) / (FONTE_MAX - FONTE_MIN)) * 100;
      rangeTamanhoFonte.style.setProperty('--range-progress', `${percentual}%`);
      rangeTamanhoFonte.closest('.range-shell')?.style.setProperty('--range-progress', `${percentual}%`);
    }

    function toggleMenu() {
      menuVisivel = !menuVisivel;
      menuControles.style.display = menuVisivel ? 'block' : 'none';
      if (menuVisivel) aplicarGlowDaCorGlobal();
      else resetarGlowPadrao();
    }

    function atualizarCor(event) {
      const diaAtual = getActiveDay();
      const novaCor = event.target.value;
      document.documentElement.style.setProperty('--cor-global', novaCor);
      localStorage.setItem(getColorStorageKey(diaAtual), novaCor);
      if (menuVisivel) aplicarGlowDaCorGlobal();
    }

    function aplicarTamanhoFonte(novoTamanho) {
      const tamanhoSeguro = Math.min(FONTE_MAX, Math.max(FONTE_MIN, parseInt(novoTamanho, 10) || FONTE_PADRAO));
      if (window.GlobalFontScale?.setSize) {
        window.GlobalFontScale.setSize(tamanhoSeguro);
      } else {
        document.documentElement.style.setProperty('--tamanho-fonte', `${tamanhoSeguro}px`);
        document.documentElement.style.setProperty('--font-base-global', `${tamanhoSeguro}px`);
        document.documentElement.style.setProperty('--font-scale-global', String(tamanhoSeguro / FONTE_PADRAO));
        localStorage.setItem(fonteStorageKey, tamanhoSeguro);
      }
      rangeTamanhoFonte.value = String(tamanhoSeguro);
      atualizarRangeVisual(tamanhoSeguro);
    }

    function limparPreferencias() {
      if (confirm("Isso irá apagar todas as cores, fontes, temas e ANOTAÇÕES. Deseja continuar?")) {
        Object.keys(localStorage)
          .filter((key) => key === fonteStorageKey || key === 'tema-interface' || /^cor-(sex|sab|dom)$/.test(key) || key.startsWith('asmb-') || /^20\d{2}-(sex|sab|dom)-/.test(key))
          .forEach((key) => localStorage.removeItem(key));

        location.reload();
      }
    }

    diaElemento.addEventListener('click', toggleMenu);
    if (corPicker) corPicker.addEventListener('input', atualizarCor);
    if (rangeTamanhoFonte) {
      rangeTamanhoFonte.addEventListener('input', (event) => aplicarTamanhoFonte(event.target.value));
      ['change', 'touchend', 'pointerup', 'mouseup'].forEach((nomeEvento) => {
        rangeTamanhoFonte.addEventListener(nomeEvento, () => {
          const valorMagnetico = Math.round(parseFloat(rangeTamanhoFonte.value) || FONTE_PADRAO);
          if (String(valorMagnetico) !== rangeTamanhoFonte.value) {
            rangeTamanhoFonte.value = String(valorMagnetico);
          }
          aplicarTamanhoFonte(valorMagnetico);
        });
      });
    }
    
    window.addEventListener('globalfont:changed', (event) => {
      const tamanho = event?.detail?.size;
      if (!tamanho || !rangeTamanhoFonte) return;
      rangeTamanhoFonte.value = String(tamanho);
      atualizarRangeVisual(tamanho);
    });

    if (btnLimparCache) btnLimparCache.addEventListener('click', limparPreferencias);
    
    window.addEventListener('programacao:daychange', (event) => {
      const dia = event?.detail?.dia;
      if (!dia) return;
      applyColorForDay(dia);
    });

    carregarPreferencias();
});