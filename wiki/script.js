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
	'htf': 'pages/htf.html'
  };

  // ---- Elements (graceful: some pages may not have all nodes) ----
  const contentEl = document.getElementById('content') || document.querySelector('.content') || document.body;
  const searchInput = document.getElementById('search');
  const pageListEl = document.getElementById('page-list') || document.querySelector('.sidebar ul');

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
      // loading placeholder
      contentEl.innerHTML = `<div class="page-loading"><p>Cargando...</p></div>`;
      const res = await fetch(path);
      if (!res.ok) throw new Error('No se pudo cargar la página');
      const html = await res.text();
      contentEl.innerHTML = html;

      // Accessibility: focus the first H1 if present
      const firstH1 = contentEl.querySelector('h1, h2, main');
      if (firstH1 && typeof firstH1.focus === 'function') firstH1.focus();
      // run post-load helpers
      runPostLoadFixups();
    } catch (err) {
      contentEl.innerHTML = `<article><h2>Error</h2><p>${escapeHtml(err.message)}</p></article>`;
    }
  }

  // small safe-escape helper
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  // ---- Wire navigation links for SPA behaviour (delegated) ----
  if (pageListEl) {
    pageListEl.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-page]');
      if (!a) return;
      e.preventDefault();
      const page = a.getAttribute('data-page');
      location.hash = `/${page}`;
    });
  }

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

  // ---- Collapsible category toggles (accessible) ----
  (function initCategoryToggles() {
    const toggles = document.querySelectorAll('.category-toggle');
    if (!toggles || toggles.length === 0) return;

    toggles.forEach(btn => {
      const targetId = btn.getAttribute('aria-controls');
      if (!targetId) return;
      const list = document.getElementById(targetId);
      if (!list) return;

      // ensure initial ARIA state
      const isOpen = !list.hasAttribute('hidden');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) btn.classList.add('open');

      // Click handler
      btn.addEventListener('click', (e) => {
        const nowOpen = btn.classList.toggle('open');
        if (nowOpen) {
          list.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
        } else {
          list.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
        }
      });

      // Keyboard support for Enter / Space
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  })();

  // ---- Replace manual [[BR]] placeholders after content load ----
  function runPostLoadFixups() {
    document.querySelectorAll('.manual-wrap').forEach(el => {
      el.innerHTML = el.innerHTML.replace(/\[\[BR\]\]/g, '<br>');
    });

    // Inicializadores por página
    // Si la página cargada contiene la calculadora de pharmacy, inicializarla
    initPharmacyCalculator(contentEl);

    // re-run any other per-page initializers here if needed
  }

  // ---- Smooth scroll for internal anchors (works together with Tooplate's behaviour) ----
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        // if link is internal and target exists, smooth scroll
        const href = this.getAttribute('href');
        if (!href || href.length === 1) return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ---- Navbar scroll effect and mobile menu toggle (attach only once) ----
  function initUIHelpers() {
    // Mobile toggle: respect existing tooplate script if present, but attach if missing
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu && !mobileToggle.dataset.enhanced) {
      mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
      mobileToggle.dataset.enhanced = '1';
    }

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar && !navbar.dataset.enhanced) {
      const onScroll = () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');

        // Fade in sections with .fade-in
        document.querySelectorAll('.fade-in').forEach(section => {
          const rect = section.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.8) section.classList.add('visible');
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      // initial run
      onScroll();
      navbar.dataset.enhanced = '1';
    }

    // contact form demo handler (if present)
    const form = document.querySelector('.contact-form');
    if (form && !form.dataset.enhanced) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        // simple visual feedback
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
      // store original text
      const sbtn = form.querySelector('button[type="submit"], .neural-btn');
      if (sbtn) sbtn.dataset.original = sbtn.textContent.trim();
      form.dataset.enhanced = '1';
    }

    // init smooth scroll for anchors
    initSmoothScroll();
  }

  // ---- Helpers ----
  // DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initUIHelpers();
    runPostLoadFixups();
  });

  // support back/forward
  window.addEventListener('hashchange', loadPageFromHash);

  // initial page load for SPA
  loadPageFromHash();

  // expose a small API for debugging if needed (window.__ROLA)
  window.__ROLA = window.__ROLA || {};
  window.__ROLA.loadPage = loadPage;
  window.__ROLA.PAGES = PAGES;

})();

/* -----------------------------------------
   naviBlock copy-to-clipboard behavior
   (leave as-is, it enhances .naviBlock clicks)
   ----------------------------------------- */
(function() {
  // Selecciona todos los bloques navi
  var blocks = document.querySelectorAll('.naviBlock');

  if (!blocks || blocks.length === 0) return;

  function fallbackCopyText(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';  // evitar scroll
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      var successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return !!successful;
    } catch (err) {
      document.body.removeChild(textarea);
      return false;
    }
  }

  function copyToClipboard(text, el) {
    // Preferir navigator.clipboard (requiere HTTPS)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function() {
        showCopied(el);
        return true;
      }).catch(function() {
        // fallback
        var ok = fallbackCopyText(text);
        if (ok) showCopied(el);
        return ok;
      });
    } else {
      // fallback
      var ok = fallbackCopyText(text);
      if (ok) showCopied(el);
      return Promise.resolve(ok);
    }
  }

  function showCopied(el) {
    // añade clase y quita tras 1.8s
    el.classList.add('copied');
    // accesibilidad: cambiar aria-live para notificar a lectores
    var live = el.querySelector('.naviCopied');
    if (live) {
      live.setAttribute('aria-live', 'polite');
      live.textContent = '¡Copiado!';
    }
    clearTimeout(el._copiedTO);
    el._copiedTO = setTimeout(function() {
      el.classList.remove('copied');
      if (live) live.textContent = 'Copiar';
    }, 1800);
  }

  blocks.forEach(function(block) {
    // si no tiene data-navi, intentar sacar el data del hijo .naviClickable
    var cmd = block.getAttribute('data-navi') || (block.querySelector('.naviClickable') && block.querySelector('.naviClickable').dataset.navi) || '';
    // si el texto es vacío, intentar construir con otros data-attributes
    if (!cmd) {
      var map = block.dataset.map, x = block.dataset.x, y = block.dataset.y;
      if (map && x && y) cmd = '/navi ' + map + ' ' + x + '/' + y;
    }

    // Si aún no tiene id, dar role y tabindex (si no están)
    if (!block.hasAttribute('role')) block.setAttribute('role', 'button');
    if (!block.hasAttribute('tabindex')) block.setAttribute('tabindex', '0');

    function handleCopyEvent(e) {
      // evita comportamiento nativo
      e.preventDefault && e.preventDefault();
      if (!cmd) return;
      copyToClipboard(cmd, block);
    }

    // click y touch
    block.addEventListener('click', handleCopyEvent, false);
    block.addEventListener('touchend', function(evt) { handleCopyEvent(evt); }, false);

    // teclado: Enter (13) y Space (32)
    block.addEventListener('keydown', function(e) {
      var code = e.keyCode || e.which;
      if (code === 13 || code === 32) {
        // impedir scroll al usar espacio
        e.preventDefault();
        handleCopyEvent(e);
      }
    }, false);
  });
})();

/* -----------------------------------------
   Pharmacy calculator initializer
   This function will run after the page HTML is injected
   into the SPA content area. It wires the inputs/buttons.
   ----------------------------------------- */
function initPharmacyCalculator(container) {
  // container: DOM node where the page HTML was injected (pass contentEl)
  container = container || document;
  const form = container.querySelector('#calcForm');
  if (!form) return;
  // avoid initializing twice
  if (form.dataset.pharmInit === '1') return;
  form.dataset.pharmInit = '1';

  // util helpers (local to this page)
  function N(v){ v = Number(v); return isNaN(v) ? 0 : v; }
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function format(v){ return (Math.round(v*10)/10).toFixed(1) + ' %'; }

  // find elements inside container (use querySelector on form to scope)
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

  // allow enter to calculate inside this form
  form.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      e.preventDefault();
      calculate();
    }
  });

  // initial clear
  clearAll();
}
