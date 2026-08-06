// scripts.js — whole-card click, fixed button size, description note, improved URL detection
const grid = document.getElementById('grid');
const searchInput = document.getElementById('search');
const resultCountEl = document.getElementById('result-count');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const THEME_KEY = 'tet-theme';

// THEME (unchanged)
function getSystemPrefersLight() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
}
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'light') {
    html.setAttribute('data-theme', 'light');
    themeToggle.setAttribute('aria-pressed', 'true');
    themeIcon.textContent = '☀️';
  } else if (theme === 'dark') {
    html.removeAttribute('data-theme');
    themeToggle.setAttribute('aria-pressed', 'false');
    themeIcon.textContent = '🌙';
  } else {
    if (getSystemPrefersLight()) {
      html.setAttribute('data-theme', 'light');
      themeToggle.setAttribute('aria-pressed', 'true');
      themeIcon.textContent = '☀️';
    } else {
      html.removeAttribute('data-theme');
      themeToggle.setAttribute('aria-pressed', 'false');
      themeIcon.textContent = '🌙';
    }
  }
}
function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') applyTheme(stored);
  else applyTheme('system');

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const storedNow = localStorage.getItem(THEME_KEY) || 'system';
      if (storedNow === 'system') applyTheme('system');
    });
  }

  themeToggle.addEventListener('click', () => {
    const cur = localStorage.getItem(THEME_KEY) || 'system';
    const next = cur === 'system' ? 'light' : cur === 'light' ? 'dark' : 'system';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// URL helpers
function normalizeUrl(u) {
  if (!u) return '#';
  const trimmed = u.trim();
  if (trimmed === '' || trimmed === '#') return '#';
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('//')) return 'https:' + trimmed;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

// Simple heuristic: treat s as URL if it contains "://" or starts with www. or contains a dot and no spaces
function looksLikeUrl(s) {
  if (!s) return false;
  const t = s.trim();
  return /:\/\//.test(t) || /^www\./i.test(t) || (t.includes('.') && !t.includes(' '));
}

// SITES loader
async function loadSites() {
  try {
    const res = await fetch('sites.json', {cache: "no-store"});
    if (!res.ok) throw new Error('Failed to fetch sites.json');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('sites.json must be an array');
    return data;
  } catch (err) {
    console.warn('Could not load sites.json, using fallback placeholders.', err);
    return [];
  }
}

// safe HTML text
function safeText(str) {
  if (!str && str !== 0) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Create card — whole-card clickable, anchor elements for accessibility
function createCard(site, query) {
  // Determine target URL: prefer site.url, but if it's a placeholder or '#', fall back to description if it looks like a URL
  let raw = (site.url || '').trim();
  if (!raw || raw === '#') {
    if (looksLikeUrl(site.description)) raw = site.description.trim();
  }
  const siteUrl = normalizeUrl(raw);

  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.setAttribute('role', 'link');
  card.setAttribute('aria-label', (site.title || 'Open') + (siteUrl && siteUrl !== '#' ? ` — opens ${siteUrl}` : ''));

  // Top: icon + title + desc
  const top = document.createElement('div');
  top.className = 'top';

  const icon = document.createElement('div');
  icon.className = 'icon';
  icon.style.background = site.color || 'linear-gradient(135deg,#111,#222)';
  icon.textContent = site.icon || '🔗';
  icon.setAttribute('aria-hidden', 'true');

  const titleWrap = document.createElement('div');

  const titleAnchor = document.createElement('a');
  titleAnchor.className = 'title-link';
  titleAnchor.href = siteUrl;
  titleAnchor.target = '_blank';
  titleAnchor.rel = 'noopener noreferrer';

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = site.title || 'Untitled';

  titleAnchor.appendChild(title);

  const desc = document.createElement('div');
  desc.className = 'desc';
  // show short human-friendly description (not the raw url)
  desc.textContent = site.descriptionLabel || site.description || '';

  titleWrap.appendChild(titleAnchor);
  titleWrap.appendChild(desc);

  top.appendChild(icon);
  top.appendChild(titleWrap);

  // Meta: note + open button
  const meta = document.createElement('div');
  meta.className = 'meta';

  const right = document.createElement('div');
  right.className = 'right';

  const note = document.createElement('div');
  note.className = 'note';
  note.textContent = site.note || site.descriptionLabel || site.description || '';

  const btn = document.createElement('a');
  btn.className = 'open-btn';
  btn.textContent = 'Open';
  btn.href = siteUrl;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';

  right.appendChild(note);
  right.appendChild(btn);

  meta.appendChild(right);

  card.appendChild(top);
  card.appendChild(meta);

  // Highlight query in title / description if provided
  if (query) {
    try {
      const q = query.trim();
      if (q.length > 0) {
        const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(esc, 'ig');
        title.innerHTML = safeText(site.title).replace(re, (m) => `<mark>${safeText(m)}</mark>`);
        desc.innerHTML = safeText(note.textContent).replace(re, (m) => `<mark>${safeText(m)}</mark>`);
      }
    } catch (e) {}
  }

  // Whole-card click handler: open in new tab unless the click was on an anchor (title or button)
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // let anchors handle themselves
    if (!siteUrl || siteUrl === '#') return;
    window.open(siteUrl, '_blank', 'noopener');
  });

  // Keyboard activation (Enter/Space)
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!siteUrl || siteUrl === '#') return;
      window.open(siteUrl, '_blank', 'noopener');
    }
  });

  return card;
}

function render(sites, query = '') {
  grid.innerHTML = '';
  if (!sites || sites.length === 0) {
    grid.innerHTML = '<p class="noscript">No sites found. Edit on GitHub to add entries.</p>';
    resultCountEl.textContent = '0 results';
    return;
  }
  sites.forEach(site => grid.appendChild(createCard(site, query)));
  resultCountEl.textContent = `${sites.length} result${sites.length !== 1 ? 's' : ''}`;
}

function filterSites(sites, q) {
  if (!q) return sites;
  const low = q.toLowerCase();
  return sites.filter(s => {
    const t = (s.title || '').toLowerCase();
    const d = (s.description || '').toLowerCase();
    const url = (s.url || '').toLowerCase();
    let hostname = '';
    try {
      const pick = url && url !== '#' ? url : (looksLikeUrl(s.description) ? s.description : '');
      hostname = pick ? new URL(normalizeUrl(pick)).hostname.toLowerCase() : '';
    } catch (e) { hostname = ''; }
    return t.includes(low) || d.includes(low) || url.includes(low) || hostname.includes(low);
  });
}

function debounce(fn, wait = 150) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// INIT
(async function init() {
  initTheme();

  const sites = await loadSites();

  // If a site has a long URL currently stored in description, normalize data:
  // If url is missing or '#', and description looks like URL, move it to url and populate a short descriptionLabel/note.
  sites.forEach(s => {
    if ((!s.url || s.url.trim() === '#') && looksLikeUrl(s.description)) {
      s.url = s.description.trim();
      // Provide a short human-friendly label for the note (hostname or service)
      try {
        const hostname = new URL(normalizeUrl(s.url)).hostname;
        s.note = hostname.replace('www.', '');
      } catch (e) {
        s.note = 'Open';
      }
      // Also set a short descriptionLabel (used under the title)
      if (!s.descriptionLabel) {
        s.descriptionLabel = s.note;
      }
    } else {
      // if a normal entry, ensure there's a short note to display
      if (!s.note) {
        s.note = s.descriptionLabel || s.description || '';
      }
      if (!s.descriptionLabel) s.descriptionLabel = s.description || '';
    }
  });

  render(sites);

  const onInput = debounce(() => {
    const q = searchInput.value.trim();
    const filtered = filterSites(sites, q);
    render(filtered, q);
  }, 150);

  searchInput.addEventListener('input', onInput);

  // "/" focuses search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });
})();
