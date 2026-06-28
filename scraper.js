/* ============================================================================
   HoopScout — FIBA scraper  (run in the BROWSER, on fiba.basketball pages)
   ----------------------------------------------------------------------------
   WHY THIS RUNS IN THE BROWSER
   The FIBA site is a JavaScript app: rosters and box scores are fetched from
   FIBA's backend and rendered after the page loads. A plain server-side fetch
   (or curl) only gets an empty shell. In a real browser tab the data IS there,
   so we extract it client-side — paste this in DevTools console (or run it via
   your Claude-in-Brave extension on the FIBA tab).

   THREE WAYS TO GET DATA, easiest first. Try 1, fall back to 2/3.
   ========================================================================== */

window.HS = (function () {
  const out = {};

  /* ------------------------------------------------------------------ *
   * 1) NETWORK CAPTURE  (most reliable)
   *    Run HS.spy() FIRST, then reload the roster/boxscore page. Every
   *    JSON response the app fetches is captured into HS.captures. Inspect
   *    them (console: HS.captures) to find the one holding players/stats,
   *    then shape it with HS.fromApi(obj) — adjust field names to match.
   * ------------------------------------------------------------------ */
  out.captures = [];
  out.spy = function () {
    if (out._spying) return console.log("[HS] already spying");
    out._spying = true;
    const origFetch = window.fetch;
    window.fetch = async function (...a) {
      const res = await origFetch.apply(this, a);
      try {
        const url = (a[0] && a[0].url) || a[0];
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("json")) {
          res.clone().json().then(j => {
            out.captures.push({ url, json: j });
            console.log("[HS] captured", url, j);
          }).catch(() => {});
        }
      } catch (e) {}
      return res;
    };
    // also XHR
    const OX = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (m, u) {
      this.addEventListener("load", function () {
        try {
          if ((this.getResponseHeader("content-type") || "").includes("json")) {
            const j = JSON.parse(this.responseText);
            out.captures.push({ url: u, json: j });
            console.log("[HS] captured(xhr)", u, j);
          }
        } catch (e) {}
      });
      return OX.apply(this, arguments);
    };
    console.log("[HS] spying on network. Now RELOAD the page, then check HS.captures");
  };

  // Recursively hunt any captured/global object for arrays that look like rosters.
  out.findPlayerArrays = function (root) {
    const hits = [];
    const seen = new Set();
    (function walk(o, path) {
      if (!o || typeof o !== "object" || seen.has(o)) return;
      seen.add(o);
      if (Array.isArray(o) && o.length && typeof o[0] === "object") {
        const keys = Object.keys(o[0]).join(",").toLowerCase();
        if (/(name|player|firstname|familyname|jersey|shirt|number)/.test(keys))
          hits.push({ path, sample: o[0], count: o.length, array: o });
      }
      for (const k in o) { try { walk(o[k], path + "." + k); } catch (e) {} }
    })(root, "root");
    return hits;
  };

  /* ------------------------------------------------------------------ *
   * 2) DOM ROSTER SCRAPE  (if you can see the roster table on screen)
   *    Open the team page, click the Roster tab so players are visible,
   *    then run HS.roster("australia"). It reads the rendered rows. FIBA
   *    markup changes over time — if columns come out wrong, tweak the
   *    selectors / index mapping in mapRow() below.
   * ------------------------------------------------------------------ */
  function txt(el) { return (el && el.textContent || "").trim(); }
  function num(s) { const m = String(s).replace(",", ".").match(/-?\d+(\.\d+)?/); return m ? +m[0] : null; }

  out.roster = function (teamId) {
    // Find the roster table: FIBA usually renders a <table> with a header row
    // containing "No"/"Player". Grab the largest plausible table.
    const tables = [...document.querySelectorAll("table")];
    let table = tables.sort((a, b) => b.querySelectorAll("tr").length - a.querySelectorAll("tr").length)[0];
    if (!table) { console.warn("[HS] no <table> found — roster may render as cards. Use HS.spy() instead."); return []; }

    const rows = [...table.querySelectorAll("tbody tr, tr")].filter(r => r.querySelectorAll("td").length >= 2);
    const players = rows.map(r => mapRow(r, teamId)).filter(Boolean);
    console.log(`[HS] parsed ${players.length} players for ${teamId}`);
    out._last = players;
    return players;
  };

  // ---- ADJUST HERE if columns are misaligned ----
  function mapRow(tr, teamId) {
    const c = [...tr.querySelectorAll("td")].map(td => td);
    // Heuristics: number is the first cell with a bare integer; name is the
    // longest text cell; position is a short G/F/C token; height like 1.95 / 195.
    let number = null, name = "", pos = "", height = "", birthYear = null;
    c.forEach(td => {
      const t = txt(td);
      if (number === null && /^\d{1,2}$/.test(t)) number = +t;
      else if (/^(G|F|C|G-F|F-G|F-C|C-F|PG|SG|SF|PF)$/i.test(t)) pos = t.toUpperCase();
      else if (/^\d\.\d{2}$/.test(t) || /^\d{3}$/.test(t)) height = /^\d{3}$/.test(t) ? (t / 100).toFixed(2) : t;
      else if (/^(19|20)\d{2}/.test(t)) { const y = +t.slice(0, 4); if (y > 2004 && y < 2014) birthYear = y; }
      else if (t.length > name.length && /[a-zA-Z]/.test(t) && t.length < 40) name = t;
    });
    // try anchor text for cleaner name
    const a = tr.querySelector("a"); if (a && txt(a).length > 2) name = txt(a);
    if (!name) return null;
    return {
      id: teamId + "-" + (number ?? Math.random().toString(36).slice(2, 5)),
      teamId, number, name, pos, height, birthYear,
      stats: { gp: 0, mpg: null, ppg: null, rpg: null, apg: null, spg: null, bpg: null, tpg: null, fgPct: null, tpPct: null, ftPct: null },
      gamelog: []
    };
  }

  /* ------------------------------------------------------------------ *
   * 3) BOXSCORE SCRAPE  (on a game page, per team boxscore table)
   *    Run HS.boxscore({teamId:"australia", opp:"VEN", date:"2026-06-27",
   *    res:"W 78-70"}). Adds a gamelog row to matching players in HS._last
   *    (or returns rows you can merge yourself).
   * ------------------------------------------------------------------ */
  out.boxscore = function (meta) {
    const tables = [...document.querySelectorAll("table")];
    const rows = [];
    tables.forEach(tb => {
      [...tb.querySelectorAll("tr")].forEach(tr => {
        const tds = [...tr.querySelectorAll("td")].map(txt);
        if (tds.length < 8) return;
        const name = txt(tr.querySelector("a")) || tds.find(t => /[a-zA-Z]{3,}/.test(t) && !/^\d/.test(t)) || "";
        if (!name) return;
        // You will likely need to map these indices to FIBA's column order.
        rows.push({ name, cells: tds });
      });
    });
    console.log("[HS] boxscore raw rows (map columns to fields):", rows);
    return rows;
  };

  /* ------------------------------------------------------------------ *
   * OUTPUT — paste the result into players.js
   * ------------------------------------------------------------------ */
  out.print = function (players) {
    const arr = players || out._last || [];
    const js = arr.map(p => "  " + JSON.stringify(p)).join(",\n");
    const blob = "/* paste inside HOOPDATA.players [...] */\n" + js + "\n";
    console.log(blob);
    // also copy to clipboard if allowed
    if (navigator.clipboard) navigator.clipboard.writeText(blob).then(
      () => console.log("[HS] copied to clipboard ✔"), () => {});
    return blob;
  };

  console.log("%c[HoopScout scraper ready]", "color:#E0913E;font-weight:bold");
  console.log("Try:  HS.spy()  then reload  →  HS.findPlayerArrays(HS.captures)");
  console.log("Or:   HS.roster('australia')  →  HS.print()");
  return out;
})();
