/* ============================================================================
   HoopScout — live-score proxy (Cloudflare Worker)
   ----------------------------------------------------------------------------
   FIBA's live-score endpoint has no CORS headers, so a static site (GitHub
   Pages) can't read it directly from the browser. This tiny Worker fetches it
   server-side and re-serves it with `access-control-allow-origin: *`, so your
   site can read live scores reliably without depending on public proxies.

   It ONLY proxies FIBA's game-live-info "light" endpoint, keyed by numeric
   game id, so it can't be abused as an open proxy.

   ----------------------------------------------------------------------------
   DEPLOY (about a minute, free):

   Option A — dashboard (no tools):
     1. Sign up / log in at https://dash.cloudflare.com  (free, no card needed)
     2. Workers & Pages  ->  Create  ->  Create Worker
     3. Name it (e.g. "hoopscout-scores"), Deploy, then "Edit code"
     4. Replace the template with THIS file's contents, Save and Deploy
     5. Copy your Worker URL, e.g.
            https://hoopscout-scores.YOURNAME.workers.dev
     6. In index.html set:   const WORKER = "https://hoopscout-scores.YOURNAME.workers.dev";
        Re-upload index.html. Done — the app now uses your Worker first and
        falls back to the public proxies only if it's ever unreachable.

   Option B — Wrangler CLI:
     npm i -g wrangler
     wrangler login
     # save this file as worker.js, then:
     wrangler deploy worker.js --name hoopscout-scores --compatibility-date 2026-06-28

   Quick test once deployed (a live or finished game id):
     https://hoopscout-scores.YOURNAME.workers.dev/?id=114414
   ============================================================================ */

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "*",
  "access-control-max-age": "86400",
};

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...extra },
  });

export default {
  async fetch(request) {
    // CORS preflight (browsers may send this for some requests)
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "GET") {
      return json({ error: "method not allowed" }, 405);
    }

    const id = new URL(request.url).searchParams.get("id");

    // Only allow numeric game ids — keeps this from being a generic open proxy.
    if (!id || !/^\d+$/.test(id)) {
      return json({ error: "missing or invalid ?id (numeric game id required)" }, 400);
    }

    const target =
      `https://www.fiba.basketball/en/events/api/game-live-info/${id}/light`;

    try {
      const upstream = await fetch(target, {
        headers: { accept: "application/json" },
        // Edge-cache for a few seconds so rapid polls don't all hit FIBA.
        cf: { cacheTtl: 5, cacheEverything: true },
      });

      const body = await upstream.text();

      // Pass through FIBA's status; add CORS + a short cache hint for the browser.
      return new Response(body, {
        status: upstream.status,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=5",
          ...CORS,
        },
      });
    } catch (err) {
      return json({ error: "upstream fetch failed", detail: String(err) }, 502);
    }
  },
};
