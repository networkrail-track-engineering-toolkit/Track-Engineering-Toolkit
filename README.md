# Track Engineering Toolkit (Landing Page)

A simple static landing page to serve as a hub for your engineering web apps. The list of links is stored in `sites.json` so it's easy to edit.

## Files
- index.html — main page (includes theme toggle and search)
- styles.css — styling with light/dark theme support
- scripts.js — loads and renders `sites.json`, provides search and theme persistence
- sites.json — list of sites (10 placeholders to start)
- README.md — this file

## How to expand sites
To add more sites, simply open `sites.json` and add more objects to the top-level array. Each entry should be an object with these fields:

{
  "title": "My App",
  "url": "https://myapp.example.com",
  "description": "Short description",
  "icon": "🔗",
  "color": "#06b6d4"
}

Important:
- `sites.json` MUST be a JSON array (e.g. [ { ... }, { ... }, ... ]). The script loads the whole array and renders every item — you can add dozens or hundreds of entries, and the page will render them all.
- For best UX, keep titles and descriptions concise.

## Search
- Type in the search box to filter by title, description, URL, or hostname.
- Use the "/" key to focus the search box (keyboard shortcut).
- Matches are highlighted in the title and description.

## Theme (Light / Dark)
- Click the theme button to cycle through three modes: system → light → dark.
- Your choice persists in localStorage.
- Default is system preference (prefers-color-scheme).

## Local testing
You can test locally by running a simple static server. For example (Python 3):

```bash
# from repo root
python -m http.server 8080
# open http://localhost:8080