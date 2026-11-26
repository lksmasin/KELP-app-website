/* KELP Website — minimal vanilla JS (i18n switcher, mobile nav, slideshow + gallery lightbox, GitHub Releases) */

(function () {
  const pageLang = (document.documentElement.lang || 'cs').toLowerCase().slice(0, 2);

  // Persist explicit language switches & preserve URL hash
  document.querySelectorAll('[data-set-lang]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetLang = link.dataset.setLang;
      try {
        localStorage.setItem('kelp_lang', targetLang);
      } catch (_) {}
      if (window.location.hash && !link.href.includes('#')) {
        e.preventDefault();
        window.location.href = link.getAttribute('href') + window.location.hash;
      }
    });
  });

  // Auto-route on root Czech pages according to saved choice or browser locale (never loops, skips crawlers)
  (function handleLanguageRouting() {
    if (window.location.protocol === 'file:') return;
    if (/bot|crawl|spider|slurp|facebookexternalhit|discordbot/i.test(navigator.userAgent || '')) return;

    const path = window.location.pathname;
    const isSubdir = path.startsWith('/en/') || path.startsWith('/sk/') || path === '/en' || path === '/sk';
    if (isSubdir) return;

    let preferred = null;
    try {
      preferred = localStorage.getItem('kelp_lang');
    } catch (_) {}

    if (!preferred) {
      try {
        if (sessionStorage.getItem('kelp_lang_auto') === '1') return;
        sessionStorage.setItem('kelp_lang_auto', '1');
      } catch (_) {}
      const navLang = ((navigator.languages && navigator.languages[0]) || navigator.language || 'cs').toLowerCase();
      if (navLang.startsWith('cs') || navLang.startsWith('cz')) {
        preferred = 'cs';
      } else if (navLang.startsWith('sk')) {
        preferred = 'sk';
      } else {
        preferred = 'en';
      }
    }

    if (preferred === 'en' || preferred === 'sk') {
      const file = path.endsWith('/') ? '' : path.replace(/^\/+/, '');
      const target = `/${preferred}/${file}${window.location.hash || ''}`;
      window.location.replace(target);
    }
  })();

  // Mobile navigation toggle
  const toggle = document.querySelector('[data-nav-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Homepage minimal slideshow + Fullscreen Gallery Lightbox
  const galleryDataEl = document.getElementById('kelp-gallery-data');
  const showcase = document.querySelector('[data-showcase]');
  if (galleryDataEl && showcase) {
    let shots = [];
    try {
      shots = JSON.parse(galleryDataEl.textContent || '[]');
    } catch (_) {
      shots = [];
    }

    const slideAria =
      pageLang === 'en'
        ? (n, t) => `Show screenshot ${n}: ${t}`
        : pageLang === 'sk'
          ? (n, t) => `Zobraziť snímku ${n}: ${t}`
          : (n, t) => `Zobrazit snímek ${n}: ${t}`;

    if (shots.length > 0) {
      const mainImg = showcase.querySelector('[data-slide-img]');
      const captionEl = showcase.querySelector('[data-slide-caption]');
      const dotsWrap = showcase.querySelector('[data-slide-dots]');
      const prevBtn = showcase.querySelector('[data-slide-prev]');
      const nextBtn = showcase.querySelector('[data-slide-next]');
      const openGalleryBtn = showcase.querySelector('[data-open-gallery]');
      const frame = showcase.querySelector('[data-slide-frame]');

      const lightbox = document.querySelector('[data-lightbox]');
      const lbImg = lightbox ? lightbox.querySelector('[data-lightbox-img]') : null;
      const lbTitle = lightbox ? lightbox.querySelector('[data-lightbox-title]') : null;
      const lbDesc = lightbox ? lightbox.querySelector('[data-lightbox-desc]') : null;
      const lbCount = lightbox ? lightbox.querySelector('[data-lightbox-count]') : null;
      const lbPrev = lightbox ? lightbox.querySelector('[data-lightbox-prev]') : null;
      const lbNext = lightbox ? lightbox.querySelector('[data-lightbox-next]') : null;
      const lbClose = lightbox ? lightbox.querySelector('[data-lightbox-close]') : null;

      let current = 0;
      let timer = null;
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const dots = shots.map((shot, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slide-dot' + (idx === 0 ? ' active' : '');
        b.setAttribute('aria-label', slideAria(idx + 1, shot.title));
        b.addEventListener('click', () => {
          showSlide(idx);
          restartAuto();
        });
        if (dotsWrap) dotsWrap.appendChild(b);
        return b;
      });

      function showSlide(idx) {
        current = ((idx % shots.length) + shots.length) % shots.length;
        const s = shots[current];
        if (mainImg) {
          mainImg.src = s.src;
          mainImg.alt = s.title;
        }
        if (captionEl) {
          captionEl.innerHTML = `<strong>${s.platform}</strong><span class="sep">•</span>${s.title}`;
        }
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
        if (lightbox && lightbox.classList.contains('open')) {
          syncLightbox();
        }
      }

      function syncLightbox() {
        const s = shots[current];
        if (lbImg) {
          lbImg.src = s.src;
          lbImg.alt = s.title;
        }
        if (lbTitle) lbTitle.textContent = `${s.platform}  •  ${s.title}`;
        if (lbDesc) lbDesc.textContent = s.desc;
        if (lbCount) lbCount.textContent = `${current + 1} / ${shots.length}`;
      }

      function stopAuto() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      function restartAuto() {
        stopAuto();
        if (prefersReduced) return;
        timer = setInterval(() => {
          if (!lightbox || !lightbox.classList.contains('open')) {
            showSlide(current + 1);
          }
        }, 6000);
      }

      function openLightbox(idx) {
        if (!lightbox) return;
        if (typeof idx === 'number') showSlide(idx);
        syncLightbox();
        stopAuto();
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
      }

      function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        restartAuto();
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showSlide(current - 1);
          restartAuto();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showSlide(current + 1);
          restartAuto();
        });
      }
      if (frame) {
        frame.addEventListener('click', () => openLightbox(current));
        frame.addEventListener('mouseenter', stopAuto);
        frame.addEventListener('mouseleave', restartAuto);
      }
      if (openGalleryBtn) {
        openGalleryBtn.addEventListener('click', () => openLightbox(0));
      }
      if (lbPrev) lbPrev.addEventListener('click', () => showSlide(current - 1));
      if (lbNext) lbNext.addEventListener('click', () => showSlide(current + 1));
      if (lbClose) lbClose.addEventListener('click', closeLightbox);
      if (lightbox) {
        lightbox.addEventListener('click', (e) => {
          if (e.target === lightbox) closeLightbox();
        });
      }

      document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showSlide(current - 1);
        if (e.key === 'ArrowRight') showSlide(current + 1);
      });

      showSlide(0);
      restartAuto();
    }
  }

  // Dynamic GitHub Releases lookup (download.html)
  const releaseRoot = document.querySelector('[data-releases-repo]');
  if (releaseRoot) {
    const repo = releaseRoot.dataset.releasesRepo;
    const versionBadge = document.querySelector('[data-latest-version]');

    fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((release) => {
        if (!release || !release.assets) return;
        if (versionBadge && release.tag_name) {
          versionBadge.textContent = release.tag_name;
        }
        const bind = (id, patterns) => {
          const link = document.getElementById(id);
          if (!link) return;
          for (const re of patterns) {
            const asset = release.assets.find((a) => re.test(a.name));
            if (asset) {
              link.href = asset.browser_download_url;
              const meta = document.querySelector(`[data-meta-for="${id}"]`);
              if (meta) {
                const mb = (asset.size / (1024 * 1024)).toFixed(1);
                meta.textContent = `${asset.name}  •  ${mb} MB`;
              }
              return;
            }
          }
        };
        bind('dl-windows', [/windows.*\.msi$/i, /windows.*\.zip$/i]);
        bind('dl-linux', [/linux.*\.deb$/i, /linux.*\.tar\.gz$/i, /linux.*\.zip$/i]);
      })
      .catch(() => {
        // Keep static fallback URLs pointing to GitHub Releases & Google Play
      });
  }
})();
