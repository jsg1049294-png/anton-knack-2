/* ANTON KNACK 2 – Core Application Logic */

(function () {
  'use strict';

  // ========== State ==========
  const state = {
    tabs: [],
    activeTabId: null,
    nextTabId: 1,
    devtoolsOpen: false,
  };

  // Known sites that commonly block framing
  const BLOCKED_DOMAINS = [
    'anton.app',
    'www.anton.app',
    'login.anton.app',
    'accounts.google.com',
    'login.microsoftonline.com',
    'github.com', // sometimes
  ];

  // ========== DOM References ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const tabsEl = $('#tabs');
  const addressBar = $('#address-bar');
  const browserFrame = $('#browser-frame');
  const startPage = $('#start-page');
  const iframeContainer = $('#iframe-container');
  const blockedOverlay = $('#blocked-overlay');
  const blockedUrlEl = $('#blocked-url');
  const loadingIndicator = $('#loading-indicator');
  const consoleOutput = $('#console-output');
  const networkList = $('#network-list');

  // ========== Utility ==========
  function log(type, ...args) {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    const time = new Date().toLocaleTimeString('de-DE');
    line.textContent = `[${time}] ${args.map(a => {
      if (typeof a === 'object') {
        try { return JSON.stringify(a); } catch { return String(a); }
      }
      return String(a);
    }).join(' ')}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  // Intercept console
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  ['log', 'info', 'warn', 'error'].forEach(method => {
    console[method] = (...args) => {
      originalConsole[method](...args);
      log(method, ...args);
    };
  });

  function isProbablyBlocked(url) {
    try {
      const u = new URL(url);
      return BLOCKED_DOMAINS.some(d => u.hostname === d || u.hostname.endsWith('.' + d));
    } catch {
      return false;
    }
  }

  function normalizeUrl(input) {
    input = (input || '').trim();
    if (!input) return null;

    // Google search shortcut
    if (!input.includes('.') && !input.startsWith('http')) {
      return 'https://www.google.com/search?q=' + encodeURIComponent(input);
    }

    if (!/^https?:\/\//i.test(input)) {
      input = 'https://' + input;
    }
    try {
      new URL(input);
      return input;
    } catch {
      return 'https://www.google.com/search?q=' + encodeURIComponent(input);
    }
  }

  // ========== Tab Management ==========
  function createTab(url = null, title = 'Neuer Tab') {
    const id = state.nextTabId++;
    const tab = {
      id,
      title,
      url: url || 'about:blank',
      history: url ? [url] : [],
      historyIndex: url ? 0 : -1,
      isStartPage: !url,
    };
    state.tabs.push(tab);
    renderTabs();
    switchToTab(id);
    if (url) {
      navigate(url, false);
    }
    return id;
  }

  function closeTab(id) {
    const idx = state.tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    state.tabs.splice(idx, 1);
    if (state.tabs.length === 0) {
      createTab();
      return;
    }
    if (state.activeTabId === id) {
      const newActive = state.tabs[Math.max(0, idx - 1)];
      switchToTab(newActive.id);
    }
    renderTabs();
  }

  function switchToTab(id) {
    const tab = state.tabs.find(t => t.id === id);
    if (!tab) return;
    state.activeTabId = id;
    renderTabs();
    updateNavButtons();

    if (tab.isStartPage || tab.url === 'about:blank') {
      showStartPage();
      addressBar.value = '';
    } else {
      showIframePage();
      addressBar.value = tab.url;
      // Only reload if different
      if (browserFrame.src !== tab.url && !isProbablyBlocked(tab.url)) {
        loadInFrame(tab.url);
      } else if (isProbablyBlocked(tab.url)) {
        showBlocked(tab.url);
      }
    }
  }

  function getActiveTab() {
    return state.tabs.find(t => t.id === state.activeTabId);
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    state.tabs.forEach(tab => {
      const el = document.createElement('div');
      el.className = 'tab' + (tab.id === state.activeTabId ? ' active' : '');
      el.innerHTML = `
        <span class="tab-title">${escapeHtml(tab.title)}</span>
        <button class="tab-close" data-id="${tab.id}">×</button>
      `;
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) return;
        switchToTab(tab.id);
      });
      el.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(tab.id);
      });
      tabsEl.appendChild(el);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ========== Navigation ==========
  function navigate(input, addToHistory = true) {
    const url = normalizeUrl(input);
    if (!url) return;

    const tab = getActiveTab();
    if (!tab) return;

    tab.url = url;
    tab.isStartPage = false;
    tab.title = getTitleFromUrl(url);

    if (addToHistory) {
      // Truncate forward history
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(url);
      tab.historyIndex = tab.history.length - 1;
    }

    addressBar.value = url;
    renderTabs();
    updateNavButtons();
    showIframePage();

    if (isProbablyBlocked(url)) {
      showBlocked(url);
      log('warn', 'Seite wahrscheinlich blockiert (X-Frame-Options):', url);
    } else {
      loadInFrame(url);
    }
  }

  function getTitleFromUrl(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('google')) return 'Google';
      if (u.hostname.includes('anton')) return 'ANTON';
      return u.hostname.replace('www.', '');
    } catch {
      return 'Seite';
    }
  }

  function loadInFrame(url) {
    blockedOverlay.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    browserFrame.style.display = 'block';

    // Timeout fallback for blocked frames
    let loaded = false;
    const timeout = setTimeout(() => {
      if (!loaded) {
        // Assume possible block after 4s of no load event in some cases
        // But better to rely on error or user feedback
      }
    }, 4000);

    browserFrame.onload = () => {
      loaded = true;
      clearTimeout(timeout);
      loadingIndicator.classList.add('hidden');
      try {
        // Try to access title (fails on cross-origin)
        const title = browserFrame.contentDocument?.title;
        if (title) {
          const tab = getActiveTab();
          if (tab) {
            tab.title = title.slice(0, 40);
            renderTabs();
          }
        }
      } catch (e) {
        // Cross-origin – expected
      }
      log('info', 'Frame geladen:', url);
    };

    browserFrame.onerror = () => {
      loaded = true;
      clearTimeout(timeout);
      loadingIndicator.classList.add('hidden');
      showBlocked(url);
    };

    try {
      browserFrame.src = url;
    } catch (e) {
      showBlocked(url);
    }
  }

  function showBlocked(url) {
    loadingIndicator.classList.add('hidden');
    browserFrame.style.display = 'none';
    browserFrame.src = 'about:blank';
    blockedUrlEl.textContent = url;
    blockedOverlay.classList.remove('hidden');
    log('warn', 'Einbettung blockiert für:', url);
  }

  function showStartPage() {
    startPage.classList.add('active');
    iframeContainer.classList.remove('active');
    blockedOverlay.classList.add('hidden');
    loadingIndicator.classList.add('hidden');
  }

  function showIframePage() {
    startPage.classList.remove('active');
    iframeContainer.classList.add('active');
  }

  function updateNavButtons() {
    const tab = getActiveTab();
    const backBtn = $('#back-btn');
    const forwardBtn = $('#forward-btn');
    if (!tab) {
      backBtn.disabled = true;
      forwardBtn.disabled = true;
      return;
    }
    backBtn.disabled = tab.historyIndex <= 0;
    forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;
  }

  function goBack() {
    const tab = getActiveTab();
    if (!tab || tab.historyIndex <= 0) return;
    tab.historyIndex--;
    const url = tab.history[tab.historyIndex];
    tab.url = url;
    tab.title = getTitleFromUrl(url);
    addressBar.value = url;
    renderTabs();
    updateNavButtons();
    if (isProbablyBlocked(url)) showBlocked(url);
    else loadInFrame(url);
  }

  function goForward() {
    const tab = getActiveTab();
    if (!tab || tab.historyIndex >= tab.history.length - 1) return;
    tab.historyIndex++;
    const url = tab.history[tab.historyIndex];
    tab.url = url;
    tab.title = getTitleFromUrl(url);
    addressBar.value = url;
    renderTabs();
    updateNavButtons();
    if (isProbablyBlocked(url)) showBlocked(url);
    else loadInFrame(url);
  }

  function reload() {
    const tab = getActiveTab();
    if (!tab || tab.isStartPage) return;
    if (isProbablyBlocked(tab.url)) {
      showBlocked(tab.url);
    } else {
      loadInFrame(tab.url);
    }
  }

  // ========== Event Bindings ==========
  function bindEvents() {
    $('#new-tab-btn').addEventListener('click', () => createTab());

    $('#back-btn').addEventListener('click', goBack);
    $('#forward-btn').addEventListener('click', goForward);
    $('#reload-btn').addEventListener('click', reload);
    $('#home-btn').addEventListener('click', () => {
      const tab = getActiveTab();
      if (tab) {
        tab.isStartPage = true;
        tab.url = 'about:blank';
        tab.title = 'Startseite';
        showStartPage();
        addressBar.value = '';
        renderTabs();
      }
    });

    $('#go-btn').addEventListener('click', () => navigate(addressBar.value));
    addressBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigate(addressBar.value);
      }
    });

    $('#google-btn').addEventListener('click', () => {
      const q = addressBar.value.trim();
      if (q && !q.startsWith('http')) {
        navigate('https://www.google.com/search?q=' + encodeURIComponent(q));
      } else {
        navigate('https://www.google.com');
      }
    });

    // Start page search
    $('#start-search-btn').addEventListener('click', () => {
      const q = $('#start-search').value.trim();
      if (q) navigate(q);
    });
    $('#start-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = $('#start-search').value.trim();
        if (q) navigate(q);
      }
    });

    // Shortcuts
    $$('.shortcut').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const url = el.dataset.url;
        if (url) navigate(url);
      });
    });

    // Blocked overlay buttons
    $('#open-external-btn').addEventListener('click', () => {
      const tab = getActiveTab();
      if (tab && tab.url) {
        window.open(tab.url, '_blank', 'noopener,noreferrer');
        log('info', 'In neuem Tab geöffnet:', tab.url);
      }
    });
    $('#try-again-btn').addEventListener('click', () => {
      const tab = getActiveTab();
      if (tab) loadInFrame(tab.url);
    });

    // Fullscreen
    $('#fullscreen-btn').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.() ||
          document.documentElement.webkitRequestFullscreen?.();
      } else {
        document.exitFullscreen?.() || document.webkitExitFullscreen?.();
      }
    });

    // DevTools
    $('#devtools-btn').addEventListener('click', toggleDevTools);
    $('#close-devtools').addEventListener('click', () => {
      state.devtoolsOpen = false;
      $('#devtools').classList.add('hidden');
    });

    $$('.dt-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.dt-tab').forEach(b => b.classList.remove('active'));
        $$('.dt-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = $('#panel-' + btn.dataset.panel);
        if (panel) panel.classList.add('active');
      });
    });

    // Console input
    $('#console-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const code = e.target.value.trim();
        if (!code) return;
        log('log', '> ' + code);
        try {
          const result = eval(code);
          if (result !== undefined) log('info', result);
        } catch (err) {
          log('error', err.message);
        }
        e.target.value = '';
      }
    });

    // Elements inspect
    $('#inspect-btn').addEventListener('click', () => {
      const output = $('#elements-output');
      try {
        // Only works for same-origin or about:blank
        const doc = browserFrame.contentDocument;
        if (!doc) {
          output.textContent = 'Kein Dokument zugänglich (Cross-Origin oder leerer Frame).\n\nHinweis: Fremde Websites können aus Sicherheitsgründen (Same-Origin-Policy) nicht inspiziert werden.';
          return;
        }
        const html = doc.documentElement.outerHTML;
        output.textContent = html.slice(0, 15000) + (html.length > 15000 ? '\n\n… (gekürzt)' : '');
      } catch (e) {
        output.textContent = 'Zugriff verweigert (Cross-Origin):\n' + e.message +
          '\n\nEchte Elements-Inspektion für fremde Seiten benötigt einen Remote-Browser-Backend.';
      }
    });
  }

  function toggleDevTools() {
    state.devtoolsOpen = !state.devtoolsOpen;
    const dt = $('#devtools');
    if (state.devtoolsOpen) {
      dt.classList.remove('hidden');
      log('info', 'Developer Tools geöffnet');
    } else {
      dt.classList.add('hidden');
    }
  }

  // ========== Init ==========
  function init() {
    bindEvents();
    createTab(); // Start with one empty tab
    log('info', 'ANTON KNACK 2 gestartet');
    log('info', 'Touch-optimierter Browser für iPad / Safari');
    log('warn', 'Vollständige DevTools für fremde Seiten erfordern ein Backend (siehe Info-Tab)');
  }

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
