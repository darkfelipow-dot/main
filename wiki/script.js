// script.js — Router + page loader + UI glue to match Tooplate "Neural" behaviour
// Designed to be compatible with index.html that already loads tooplate-neural-style.js/css
(() => {
  // ---- Config: pages (add/remove keys to match your pages/) ----
  const PAGES = {
    'ragnarok-online': 'pages/ragnarok-online.html',
    'prontera': 'pages/prontera.html',
    'weekend': 'pages/weekend.html',
    'friday': 'pages/friday.html',
    'MalandgoE': 'pages/MalandgoE.html',
    'nightmarish-jitterbug': 'pages/nightmarish-jitterbug.html',
    'ogh': 'pages/ogh.html',
    'ogh-hard': 'pages/ogh-hard.html',
    'temporalboots': 'pages/temporalboots.html',
    'pharmachy': 'pages/pharmachy.html',
    'jobquestp2w': 'pages/jobquestp2w.html',
    'htf': 'pages/htf.html',
    'illusionluanda': 'pages/illusionluanda.html',
    'roastturkey': 'pages/roastturkey.html',
    'OvalArtifact': 'pages/OvalArtifact.html'
  };

  // ---- Elements (graceful: some pages may not have all nodes) ----
  const contentEl = document.getElementById('content') || document.querySelector('.content') || document.body;
  const searchInput = document.getElementById('search');
  const pageListEl = document.getElementById('page-list') || document.querySelector('.sidebar ul');

  // ---- Background toggle: persist and apply ----
  const TOGGLE_KEY = 'rolatam:neuralEnabled';
  const bgToggleBtn = document.getElementById('toggle-bg');

  function readPref() {
    const v = localStorage.getItem(TOGGLE_KEY);
    if (v === null) return true; // default enabled
    return v === '1';
  }

  function writePref(enabled) {
    try { localStorage.setItem(TOGGLE_KEY, enabled ? '1' : '0'); } catch (e) { /* ignore storage errors */ }
  }

  function updateToggleUI(enabled) {
    if (!bgToggleBtn) return;
    bgToggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    bgToggleBtn.textContent = enabled ? 'Fondo: On' : 'Fondo: Off';
  }

  function applyNeuralEnabled(enabled) {
    document.body.classList.toggle('no-neural-bg', !enabled);
    if (window.neuralControl && typeof window.neuralControl.setEnabled === 'function') {
      try { window.neuralControl.setEnabled(enabled); } catch (e) { /* ignore */ }
    }
    updateToggleUI(enabled);
    writePref(enabled);
  }

  try {
    const initialEnabled = readPref();
    updateToggleUI(initialEnabled);
    applyNeuralEnabled(initialEnabled);
  } catch (e) {
    // ignore storage errors
  }

  if (bgToggleBtn) {
    bgToggleBtn.addEventListener('click', (e) => {
      const current = (bgToggleBtn.getAttribute('aria-pressed') === 'true');
      applyNeuralEnabled(!current);
    });
    bgToggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        bgToggleBtn.click();
      }
    });
  }

  // ---- SPA loader ----
  function loadPageFromHash() {
    const hash = location.hash.replace(/^#\/?/, '');
    const slug = hash || 'ragnarok-online';
    loadPage(slug);
  }

  async function loadPage(slug) {
    const path = PAGES[slug];
    if (!path) {
      contentEl.innerHTML = `<article><h2>Artículo no encontrado</h2><p>El artículo "${escapeHtml(slug)}" no existe.</p></article>`;
      return;
    }
    try {
      contentEl.innerHTML = `<div class="page-loading"><p>Cargando...</p></div>`;
      const res = await fetch(path);
      if (!res.ok) throw new Error('No se pudo cargar la página');
      const html = await res.text();
      contentEl.innerHTML = html;

      const firstH1 = contentEl.querySelector('h1, h2, main');
      if (firstH1 && typeof firstH1.focus === 'function') firstH1.focus();
      runPostLoadFixups();
    } catch (err) {
      contentEl.innerHTML = `<article><h2>Error</h2><p>${escapeHtml(err.message)}</p></article>`;
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  // ---- Wire navigation links for SPA behaviour (delegated) ----
  // Listen on both the recent list and the categories area (delegation)
  function delegatePageLinkClicks(container) {
    if (!container) return;
    container.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-page]');
      if (!a) return;
      e.preventDefault();
      const page = a.getAttribute('data-page');
      if (page) location.hash = `/${page}`;
    });
  }
  delegatePageLinkClicks(pageListEl);
  // ensure categories nav also delegates
  delegatePageLinkClicks(document.getElementById('categories-nav') || document.querySelector('.categories-nav'));

  // ---- Search input: filter sidebar + optionally auto-load first match ----
  if (searchInput && pageListEl) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const items = [...pageListEl.querySelectorAll('li')];
      items.forEach(li => {
        const text = li.textContent.toLowerCase();
        li.style.display = text.includes(q) ? '' : 'none';
      });

      if (q) {
        const first = pageListEl.querySelector('li:not([style*="display: none"]) a[data-page]');
        if (first) {
          const page = first.getAttribute('data-page');
          if (location.hash.replace(/^#\/?/, '') !== page) {
            location.hash = `/${page}`;
          }
        }
      }
    });
  }

  // ---- Delegated accessible category toggles (robusto) ----
  (function initCategoryTogglesDelegated() {
    const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
    if (!sidebar) return;

    // Click delegation
    sidebar.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-toggle');
      if (!btn) return;
      e.preventDefault();

      const targetId = btn.getAttribute('aria-controls');
      let list = null;

      if (targetId) {
        // Try getElementById first
        list = document.getElementById(targetId);
        if (!list) {
          // Fallback using CSS.escape to query selector (handles weird ids)
          try {
            list = document.querySelector('#' + CSS.escape(targetId));
          } catch (_) { list = null; }
        }
      }

      // If we still don't have a list, try to find a nearby .category-sublist (sibling or next)
      if (!list) {
        const possible = btn.nextElementSibling;
        if (possible && possible.classList && possible.classList.contains('category-sublist')) {
          list = possible;
        } else {
          // try parent/descendant search
          list = btn.parentElement ? btn.parentElement.querySelector('.category-sublist') : null;
        }
      }

      if (!list) {
        // nothing to toggle
        return;
      }

      const isOpen = !list.hasAttribute('hidden');
      if (isOpen) {
        list.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('open');
      } else {
        list.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('open');
      }
    });

    // Keyboard support delegated: Enter / Space
    sidebar.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const btn = e.target.closest('.category-toggle');
      if (!btn) return;
      e.preventDefault();
      btn.click();
    });

    // Ensure initial ARIA states are correct for any toggles already in the DOM
    [...(sidebar.querySelectorAll('.category-toggle') || [])].forEach(btn => {
      const targetId = btn.getAttribute('aria-controls');
      let list = null;
      if (targetId) list = document.getElementById(targetId) || document.querySelector('#' + CSS.escape(targetId));
      if (!list) {
        const possible = btn.nextElementSibling;
        if (possible && possible.classList && possible.classList.contains('category-sublist')) list = possible;
        else list = btn.parentElement ? btn.parentElement.querySelector('.category-sublist') : null;
      }
      const isOpen = list && !list.hasAttribute('hidden');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) btn.classList.add('open');
      else btn.classList.remove('open');
    });
  })();

  // ---- Replace manual [[BR]] placeholders after content load ----
  function runPostLoadFixups() {
    document.querySelectorAll('.manual-wrap').forEach(el => {
      el.innerHTML = el.innerHTML.replace(/\[\[BR\]\]/g, '<br>');
    });

    // Llamar solo si la función existe (evita "is not defined")
    if (typeof initPharmacyCalculator === 'function') {
      try {
        initPharmacyCalculator(contentEl);
      } catch (e) {
        console.error('initPharmacyCalculator falló:', e);
      }
    }
  }

  // ---- Smooth scroll for internal anchors (works together with Tooplate's behaviour) ----
  // Skip SPA hash routes "#/..." and links that use data-page; protect querySelector.
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href.length === 1) return;

        // Don't interfere with SPA hash-based links or data-page links
        if (href.startsWith('#/') || this.hasAttribute('data-page')) return;

        e.preventDefault();
        try {
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } catch (err) {
          // invalid selector - ignore
        }
      });
    });
  }

  // ---- Navbar scroll effect and mobile menu toggle (attach only once) ----
  function initUIHelpers() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu && !mobileToggle.dataset.enhanced) {
      mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
      mobileToggle.dataset.enhanced = '1';
    }

    const navbar = document.getElementById('navbar');
    if (navbar && !navbar.dataset.enhanced) {
      const onScroll = () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');

        document.querySelectorAll('.fade-in').forEach(section => {
          const rect = section.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.8) section.classList.add('visible');
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      navbar.dataset.enhanced = '1';
    }

    const form = document.querySelector('.contact-form');
    if (form && !form.dataset.enhanced) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"], .neural-btn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Enviando...';
          setTimeout(() => {
            alert('Mensaje enviado! (Demo)');
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.original || 'Enviar';
          }, 800);
        } else {
          alert('Mensaje enviado! (Demo)');
        }
      });
      const sbtn = form.querySelector('button[type="submit"], .neural-btn');
      if (sbtn) sbtn.dataset.original = sbtn.textContent.trim();
      form.dataset.enhanced = '1';
    }

    initSmoothScroll();
  }

  // ---- Helpers ----
  document.addEventListener('DOMContentLoaded', () => {
    initUIHelpers();
    runPostLoadFixups();
  });

  window.addEventListener('hashchange', loadPageFromHash);
  loadPageFromHash();

  window.__ROLA = window.__ROLA || {};
  window.__ROLA.loadPage = loadPage;
  window.__ROLA.PAGES = PAGES;

})();

/* -----------------------------------------
   naviBlock copy-to-clipboard behavior (unchanged)
   ----------------------------------------- */
// (rest of file kept as before — not included here for brevity)

/* -----------------------------------------
   Pharmacy calculator initializer
   This function will run after the page HTML is injected
   into the SPA content area. It wires the inputs/buttons.
   ----------------------------------------- */
function initPharmacyCalculator(container) {
  container = container || document;
  const form = container.querySelector('#calcForm');
  if (!form) return;
  if (form.dataset.pharmInit === '1') return;
  form.dataset.pharmInit = '1';

  function N(v){ v = Number(v); return isNaN(v) ? 0 : v; }
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function format(v){ return (Math.round(v*10)/10).toFixed(1) + ' %'; }

  const lpEl = form.querySelector('#lp') || form.querySelector('input[name="lp"]');
  const phaEl = form.querySelector('#pha') || form.querySelector('input[name="pha"]');
  const jobEl = form.querySelector('#job') || form.querySelector('input[name="job"]');
  const intEl = form.querySelector('#int') || form.querySelector('input[name="int"]');
  const dexEl = form.querySelector('#dex') || form.querySelector('input[name="dex"]');
  const lukEl = form.querySelector('#luk') || form.querySelector('input[name="luk"]');
  const homChk = form.querySelector('#homExcluded') || form.querySelector('input[name="homExcluded"]');

  const btnCalc = form.querySelector('#btnCalc');
  const btnClear = form.querySelector('#btnClear');
  const resultContent = container.querySelector('#resultContent');
  const summary = container.querySelector('#summary');

  function calculate(){
    const lp = N(lpEl.value);
    const pha = N(phaEl.value);
    const job = N(jobEl.value);
    const INT = N(intEl.value);
    const DEX = N(dexEl.value);
    const LUK = N(lukEl.value);
    const homOut = (homChk && homChk.checked) ? 5 : 0;

    const base = lp*1 + pha*3 + job*0.2 + (DEX + LUK + (INT/2))*0.1;

    const adj = {
      red: 20,
      alcohol: 10,
      special: 0,
      blue: -5,
      yslim: -7.5,
      slim: -10
    };

    let successp = clamp(base + adj.red + homOut, 0, 100);
    let successalch = clamp(base + adj.alcohol + homOut, 0, 100);
    let successspecial = clamp(base + adj.special + homOut, 0, 100);
    let successblue = clamp(base + adj.blue + homOut, 0, 100);
    let successyslim = clamp(base + adj.yslim + homOut, 0, 100);
    let successslim = clamp(base + adj.slim + homOut, 0, 100);

    if (resultContent) {
      resultContent.innerHTML = `
        <div><strong>Resultados</strong></div>
        <div style="margin-top:8px;">
          Red/Yellow/White Potions: <span class="value">${format(successp)}</span><br/>
          Alcohol: <span class="value">${format(successalch)}</span><br/>
          Acid / Plant / Marine Sphere / Bottle Grenade: <span class="value">${format(successspecial)}</span><br/>
          Blue Potions / Aloevera / Anodyne / Red Slim / Embryo / Resist Potions: <span class="value">${format(successblue)}</span><br/>
          Yellow Slim Potions: <span class="value">${format(successyslim)}</span><br/>
          White Slim Potion / Glistening Coat: <span class="value">${format(successslim)}</span>
        </div>
        <div style="margin-top:10px; font-size:13px; color:var(--muted);">
          <em>Base calculada:</em> <strong>${(Math.round(base*10)/10).toFixed(1)}</strong> (antes de ajustar por tipo y homunculus).
        </div>
      `;
    }

    if (summary) summary.innerHTML = `Base: ${(Math.round(base*10)/10).toFixed(1)} — Homunculus fuera: ${homOut ? '+'+homOut+'%' : 'no'}`;
  }

  function clearAll(){
    if (lpEl) lpEl.value = 0;
    if (phaEl) phaEl.value = 0;
    if (jobEl) jobEl.value = 0;
    if (intEl) intEl.value = 0;
    if (dexEl) dexEl.value = 0;
    if (lukEl) lukEl.value = 0;
    if (homChk) homChk.checked = false;
    if (resultContent) resultContent.innerHTML = '';
    if (summary) summary.innerHTML = '';
  }

  if (btnCalc) btnCalc.addEventListener('click', (e) => { e.preventDefault(); calculate(); });
  if (btnClear) btnClear.addEventListener('click', (e) => { e.preventDefault(); clearAll(); });

  form.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      e.preventDefault();
      calculate();
    }
  });

  clearAll();
}