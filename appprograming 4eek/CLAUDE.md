# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step required. Open `index.html` directly in a browser, or serve it with any static file server:

```bash
npx serve .
# or
python -m http.server
```

## Architecture

Single-page vanilla JS todo app. No frameworks, no bundler.

- **`index.html`** — static shell; all UI elements are pre-declared in markup (no JS-generated root nodes)
- **`script.js`** — all app logic; runs directly in the browser
- **`style.css`** — all styles; uses CSS custom properties defined in `:root`

### Data flow in `script.js`

State is a single `todos` array (module-level). Every mutation follows the same pattern:
1. Mutate `todos`
2. Call `saveTodos()` → writes to `localStorage` under key `todo_app_data`
3. Call `render()` → fully re-renders the list from scratch (no diffing)

`render()` calls three sub-renders: `renderList()`, `renderProgress()`, `renderHeader()`.

### Key behaviors

- **Sort order**: incomplete items always rendered before completed ones (`renderList`)
- **Add**: new items prepended (`todos.unshift`) so they appear at the top
- **Delete with undo**: deleted item stored in `undoBuffer`; toast shown for 3 s with Undo button; `hideToast()` clears `undoBuffer`
- **Inline edit**: double-click text or click edit icon → replaces `<span>` with `<input>` in-place; Enter/blur saves, Escape cancels
- **Persistence**: `localStorage` only; no backend

### Fonts

Loaded from Google Fonts: `Caveat` (display/title), `DM Sans` (body).
