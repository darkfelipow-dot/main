// script.js — Router + page loader + UI glue to match Tooplate "Neural" behaviour
// Designed to be compatible with index.html that already loads tooplate-neural-style.js/css
(() => {
  // ---- Config: pages (add/remove keys to match your pages/) ----
  const PAGES = {
    'ragnarok-online': 'pages/ragnarok-online.html',
    'prontera': 'pages/prontera.html',
    'weekend': 'pages/weekend.html',
    'friday': 'pages/friday.html',
    'MalandgoE': 'pages/MalandgoE.html'
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