/* KELP Website — minimal vanilla JS (mobile nav, screenshot stage, lightbox, GitHub Releases) */

(function () {
  // Mobile navigation toggle
  const toggle = document.querySelector('[data-nav-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Interactive Screenshot Stage + Lightbox (index.html)
  const stageRoot = document.querySelector('[data-stage]');
  if (stageRoot) {
    const shots = Array.from(stageRoot.querySelectorAll('[data-shot]')).map((el) => ({
      el,
      src: el.dataset.src,
      title: el.dataset.title,
      desc: el.dataset.desc,
      platform: el.dataset.platform,
      portrait: el.dataset.portrait === 'true'
    }));

    const viewport = stageRoot.querySelector('[data-stage-viewport]');
    const mainImg = stageRoot.querySelector('[data-stage-img]');
    const titleEl = stageRoot.querySelector('[data-stage-title]');
    const descEl = stageRoot.querySelector('[data-stage-desc]');
    const countEl = stageRoot.querySelector('[data-stage-count]');
    const prevBtn = stageRoot.querySelector('[data-stage-prev]');
    const nextBtn = stageRoot.querySelector('[data-stage-next]');
    const filterBtns = Array.from(stageRoot.querySelectorAll('[data-platform-filter]'));

    const lightbox = document.querySelector('[data-lightbox]');
    const lightboxImg = lightbox ? lightbox.querySelector('[data-lightbox-img]') : null;
    const lightboxCaption = lightbox ? lightbox.querySelector('[data-lightbox-caption]') : null;
    const lightboxClose = lightbox ? lightbox.querySelector('[data-lightbox-close]') : null;

    let activePlatform = 'all';
    let currentIndex = 0;

    function visibleShots() {
      return activePlatform === 'all'
        ? shots
        : shots.filter((s) => s.platform === activePlatform);
    }

    function render(idx) {
      const list = visibleShots();
      if (!list.length) return;
      currentIndex = ((idx % list.length) + list.length) % list.length;
      const shot = list[currentIndex];

      mainImg.src = shot.src;
      mainImg.alt = shot.title;
      viewport.classList.toggle('is-portrait', shot.portrait);
      titleEl.textContent = shot.title;
      descEl.textContent = shot.desc;
      countEl.textContent = `${currentIndex + 1} / ${list.length}`;

      shots.forEach((s) => {
        const show = activePlatform === 'all' || s.platform === activePlatform;
        s.el.hidden = !show;
        s.el.classList.toggle('active', s === shot);
      });
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        activePlatform = btn.dataset.platformFilter;
        filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
        render(0);
      });
    });

    shots.forEach((s) => {
      s.el.addEventListener('click', () => {
        const list = visibleShots();
        const idx = list.indexOf(s);
        if (idx >= 0) render(idx);
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', () => render(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => render(currentIndex + 1));

    // Keyboard navigation when stage is focused
    stageRoot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') render(currentIndex - 1);
      if (e.key === 'ArrowRight') render(currentIndex + 1);
    });

    // Lightbox open / close
    if (viewport && lightbox && lightboxImg) {
      viewport.addEventListener('click', () => {
        const list = visibleShots();
        const shot = list[currentIndex];
        if (!shot) return;
        lightboxImg.src = shot.src;
        lightboxImg.alt = shot.title;
        if (lightboxCaption) lightboxCaption.textContent = `${shot.title}  •  ${shot.desc}`;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
      });

      const closeLb = () => {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
      };
      if (lightboxClose) lightboxClose.addEventListener('click', closeLb);
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLb();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLb();
      });
    }

    render(0);
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
        const matchers = [
          { id: 'dl-linux', re: /linux.*\.zip$/i },
          { id: 'dl-windows', re: /windows.*\.zip$/i },
          { id: 'dl-tv-apk', re: /android-tv.*\.apk$/i },
          { id: 'dl-mobile-apk', re: /android-mobile.*\.apk$/i }
        ];
        matchers.forEach(({ id, re }) => {
          const asset = release.assets.find((a) => re.test(a.name));
          const link = document.getElementById(id);
          if (asset && link) {
            link.href = asset.browser_download_url;
            const meta = link.querySelector('[data-dl-meta]');
            if (meta) {
              const mb = (asset.size / (1024 * 1024)).toFixed(1);
              meta.textContent = `${release.tag_name}  •  ${mb} MB`;
            }
          }
        });
      })
      .catch(() => {
        // Keep clean static fallback URLs pointing to GitHub Releases & Google Play
      });
  }
})();
