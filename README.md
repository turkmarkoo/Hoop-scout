# HoopScout — FIBA U17 World Cup 2026 scouting board

A static scouting app: browse players by team, see their event stats, and keep
your own notes + interest rating on each player. Built to drop straight onto
GitHub Pages, and it works offline / from `file://` too (handy courtside).

## Files
- `index.html` — the app (all CSS/JS inline)
- `players.js` — the data (`window.HOOPDATA`): event, 16 teams in 4 groups, players
- `scraper.js` — browser snippet to pull rosters/box scores off FIBA
- 3 sample players (Slovenia) are included so it renders on first open — replace them.

## Run it
- **Locally:** open `index.html` in a browser. Done.
- **GitHub Pages:** drop all files in a repo (or a folder), enable Pages, visit the URL.

## Why there's a scraper instead of pre-filled data
FIBA's site is a JavaScript app — rosters and box scores are loaded from FIBA's
backend and rendered *after* the page loads. A server-side fetch only sees an
empty shell, so the data has to be pulled inside a real browser, where it exists.
That's what `scraper.js` does.

## Filling in real data
1. Open a FIBA team page, e.g.
   `…/fiba-u17-basketball-world-cup-2026/teams/australia#roster`, click the Roster tab.
2. Open DevTools console, paste the contents of `scraper.js`.
3. Get the players, easiest path first:
   - **Network capture (best):** `HS.spy()` → reload the page →
     `HS.findPlayerArrays(HS.captures)` to locate FIBA's roster JSON, then shape it.
   - **DOM scrape:** `HS.roster('australia')` reads the visible roster table.
4. `HS.print()` logs (and copies) the player objects.
5. Paste them into the `players` array in `players.js`, commit, refresh.
6. For per-game stats, open a game page and use `HS.boxscore({...})`, then add
   `gamelog` rows + recompute the averages in each player's `stats`.

FIBA's markup shifts between events; if columns land in the wrong fields, the
`mapRow()` mapping in `scraper.js` is commented and meant to be tweaked.

## Your notes are safe
Notes + ratings + tags are stored in your browser (localStorage), separate from
`players.js` — so re-scraping/updating rosters never wipes them. Still, use the
**Notes** button (top right) to download a JSON backup regularly, and **Import**
to restore or move notes to another device. Import merges by most-recent edit.

## Player schema
See the comment block at the top of `players.js` for every field.
