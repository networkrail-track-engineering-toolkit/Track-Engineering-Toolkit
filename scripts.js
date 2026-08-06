// scripts.js — renders cards from sites.json, provides debounced search, and theme toggle
const grid = document.getElementById('grid');
const searchInput = document.getElementById('search');
const resultCountEl = document.getElementById('result-count');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const THEME_KEY = 'tet-theme'; // Track Engineering Toolkit theme

// --- THEME HANDLING ---
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
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    applyTheme(stored);
  } else {
    applyTheme('system');
  }

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

// --- URL helpers ---
function normalizeUrl(u) {
  if (!u) return '#';
  const trimmed = u.trim();
  // preserve fragment or root-relative paths
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return trimmed;
  // protocol-relative
  if (trimmed.startsWith('//')) return 'https:' + trimmed;
  // already has scheme
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return trimmed;
  // otherwise assume https
  return 'https://' + trimmed;
}

// --- SITES LOADER ---
async function loadSites() {
  try {
    const res = await fetch('sites.json', {cache: "no-store"});
    if (!res.ok) throw new Error('Failed to fetch sites.json');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('sites.json must be an array');
    return data;
  } catch (err) {
    console.warn('Could not load sites.json, using fallback placeholders.', err);
    return [
      { title: "Placeholder 1", url: "#", description: "Replace this with your app link", icon: "🔧", color: "#0ea5a4" },
      { title: "Placeholder 2", url: "#", description: "Replace this with your app link", icon: "🧭", color: "#60a5fa" },
      { title: "Placeholder 3", url: "#", description: "Replace this with your app link", icon: "⚙️", color: "#f59e0b" },
      { title: "Placeholder 4", url: "#", description: "Replace this with your app link", icon: "📊", color: "#ef4444" },
      { title: "Placeholder 5", url: "#", description: "Replace this with your app link", icon: "🗂️", color: "#7c3aed" },
      { title: "Placeholder 6", url: "#", description: "Replace this with your app link", icon: "🧪", color: "#14b8a6" },
      { title: "Placeholder 7", url: "#", description: "Replace this with your app link", icon: "📡", color: "#06b6d4" },
      { title: "Placeholder 8", url: "#", description: "Replace this with your app link", icon: "🔍", color: "#10b981" },
      { title: "Placeholder 9", url: "#", description: "Replace this with your app link", icon: "🧭", color: "#3b82f6" },
      { title: "Placeholder 10", url: "#", description: "Replace this with your app link", icon: "📁", color: "#ef4444" }
    ];
  }
}

// --- RENDERING ---
function safeText(str) {
  if (!str && str !== 0) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function createCard(site, query) {
  const siteUrl = normalizeUrl(site.url || '#');

  const card = document.createElement('article');
  card.className = 'card';

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
  titleAnchor.setAttribute('aria-label', `${site.title} — Open in new tab`);

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = site.title || 'Untitled';

  titleAnchor.appendChild(title);

  const desc = document.createElement('div');
  desc.className = 'desc';
  desc.textContent = site.description || '';

  titleWrap.appendChild(titleAnchor);
  titleWrap.appendChild(desc);

  top.appendChild(icon);
  top.appendChild(titleWrap);

  const meta = document.createElement('div');
  meta.className = 'meta';

  const btn = document.createElement('a');
  btn.className = 'open-btn';
  btn.textContent = 'Open';
  btn.href = siteUrl;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';

  meta.appendChild(btn);

  card.appendChild(top);
  card.appendChild(meta);

  // Highlight query in title / description if provided (simple, safe)
  if (query) {
    try {
      const q = query.trim();
      if (q.length > 0) {
        const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(esc, 'ig');

        title.innerHTML = safeText(site.title).replace(re, (m) => `<mark>${safeText(m)}</mark>`);
        desc.innerHTML = safeText(site.description).replace(re, (m) => `<mark>${safeText(m)}</mark>`);
      }
    } catch (e) {
      // ignore highlight errors
    }
  }

  return card;
}

function render(sites, query = '') {
  grid.innerHTML = '';
  if (!sites || sites.length === 0) {
    grid.innerHTML = '<p class="noscript">No sites found. Edit <a href="sites.json">sites.json</a> to add entries.</p>';
    resultCountEl.textContent = '0 results';
    return;
  }
  sites.forEach(site => grid.appendChild(createCard(site, query)));
  resultCountEl.textContent = `${sites.length} result${sites.length !== 1 ? 's' : ''}`;
}

// --- SEARCH / FILTER ---
function filterSites(sites, q) {
  if (!q) return sites;
  const low = q.toLowerCase();
  return sites.filter(s => {
    const t = (s.title || '').toLowerCase();
    const d = (s.description || '').toLowerCase();
    const u = (s.url || '').toLowerCase();
    let hostname = '';
    try {
      hostname = new URL(normalizeUrl(s.url || '')).hostname.toLowerCase();
    } catch (e) { hostname = ''; }
    return t.includes(low) || d.includes(low) || u.includes(low) || hostname.includes(low);
  });
}

function debounce(fn, wait = 150) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// --- INIT ---
(async function init() {
  initTheme();

  const sites = await loadSites();
  render(sites);

  const onInput = debounce(() => {
    const q = searchInput.value.trim();
    const filtered = filterSites(sites, q);
    render(filtered, q);
  }, 150);

  searchInput.addEventListener('input', onInput);

  // Accessibility: pressing / focuses search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });
})();
