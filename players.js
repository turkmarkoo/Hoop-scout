/* ============================================================================
   HoopScout — data file
   ----------------------------------------------------------------------------
   This file defines window.HOOPDATA, which the app reads on load.
   It is a plain <script src> file (NOT fetched), so it works offline and from
   file:// as well as from GitHub Pages.

   To update rosters/stats: run scraper.js on each FIBA team page (see README),
   paste the player objects it produces into the `players` array below, and
   commit. Notes you write in the app are stored separately (localStorage), so
   regenerating this file never touches your notes.

   PLAYER SCHEMA
   {
     id:        "aus-7",          // unique, stable. convention: <teamId>-<number>
     teamId:    "australia",      // must match a team id below
     number:    7,
     name:      "Last, First",
     pos:       "G",              // G / F / C (or G-F etc.)
     height:    "1.95",           // metres (string ok), or "" if unknown
     birthYear: 2009,             // or null
     stats: {                      // EVENT averages (per game)
       gp: 1, mpg: 24.0,
       ppg: 12.0, rpg: 5.0, apg: 3.0, spg: 1.0, bpg: 0.0, tpg: 2.0,
       fgPct: 0.45, tpPct: 0.33, ftPct: 0.80
     },
     gamelog: [                    // one row per game played at the event
       { date:"2026-06-27", opp:"VEN", res:"W 78-70", min:24,
         pts:12, reb:5, ast:3, stl:1, blk:0, to:2,
         fgm:5, fga:11, tpm:1, tpa:3, ftm:1, fta:1 }
     ],
     _sample: true                 // remove on real data; just flags demo rows
   }
   ========================================================================== */

window.HOOPDATA = {
  event: {
    name: "FIBA U17 Basketball World Cup 2026",
    short: "U17 World Cup 2026",
    id: 208545,
    city: "Istanbul, Türkiye",
    dates: "27 Jun – 5 Jul 2026",
    url: "https://www.fiba.basketball/en/events/fiba-u17-basketball-world-cup-2026"
  },

  // Group structure (confirmed from the official draw)
  groups: {
    A: ["italy", "usa", "france", "japan"],
    B: ["cameroon", "canada", "lithuania", "china"],
    C: ["new-zealand", "slovenia", "puerto-rico", "turkiye"],
    D: ["venezuela", "australia", "serbia", "cote-divoire"]
  },

  // Each team carries the FIBA roster URL so the scraper knows where to go.
  teams: [
    { id:"italy",        name:"Italy",         code:"ITA", group:"A" },
    { id:"usa",          name:"USA",           code:"USA", group:"A" },
    { id:"france",       name:"France",        code:"FRA", group:"A" },
    { id:"japan",        name:"Japan",         code:"JPN", group:"A" },
    { id:"cameroon",     name:"Cameroon",      code:"CMR", group:"B" },
    { id:"canada",       name:"Canada",        code:"CAN", group:"B" },
    { id:"lithuania",    name:"Lithuania",     code:"LTU", group:"B" },
    { id:"china",        name:"China",         code:"CHN", group:"B" },
    { id:"new-zealand",  name:"New Zealand",   code:"NZL", group:"C" },
    { id:"slovenia",     name:"Slovenia",      code:"SLO", group:"C" },
    { id:"puerto-rico",  name:"Puerto Rico",   code:"PUR", group:"C" },
    { id:"turkiye",      name:"Türkiye",       code:"TUR", group:"C" },
    { id:"venezuela",    name:"Venezuela",     code:"VEN", group:"D" },
    { id:"australia",    name:"Australia",     code:"AUS", group:"D" },
    { id:"serbia",       name:"Serbia",        code:"SRB", group:"D" },
    { id:"cote-divoire", name:"Côte d'Ivoire", code:"CIV", group:"D" }
  ].map(t => ({
    ...t,
    rosterUrl: "https://www.fiba.basketball/en/events/fiba-u17-basketball-world-cup-2026/teams/" + t.id + "#roster"
  })),

  // -------------------------------------------------------------------------
  // SAMPLE PLAYERS — replace these with real scraped data.
  // These exist only so the interface renders something on first open. They
  // are flagged with _sample:true and the names/stats are made up.
  // -------------------------------------------------------------------------
  players: [
    {
      id:"slovenia-4", teamId:"slovenia", number:4, name:"Sample, Anze",
      pos:"G", height:"1.91", birthYear:2009,
      stats:{ gp:1, mpg:27.3, ppg:16.0, rpg:4.0, apg:6.0, spg:2.0, bpg:0.0, tpg:2.0,
              fgPct:0.500, tpPct:0.400, ftPct:0.833 },
      gamelog:[
        { date:"2026-06-27", opp:"TUR", res:"L 71-74", min:27,
          pts:16, reb:4, ast:6, stl:2, blk:0, to:2, fgm:6, fga:12, tpm:2, tpa:5, ftm:2, fta:2 }
      ],
      _sample:true
    },
    {
      id:"slovenia-10", teamId:"slovenia", number:10, name:"Primer, Luka",
      pos:"F", height:"2.03", birthYear:2009,
      stats:{ gp:1, mpg:25.0, ppg:11.0, rpg:9.0, apg:1.0, spg:1.0, bpg:1.0, tpg:1.0,
              fgPct:0.417, tpPct:0.250, ftPct:0.750 },
      gamelog:[
        { date:"2026-06-27", opp:"TUR", res:"L 71-74", min:25,
          pts:11, reb:9, ast:1, stl:1, blk:1, to:1, fgm:5, fga:12, tpm:1, tpa:4, ftm:0, fta:0 }
      ],
      _sample:true
    },
    {
      id:"slovenia-13", teamId:"slovenia", number:13, name:"Vzorec, Nik",
      pos:"C", height:"2.08", birthYear:2009,
      stats:{ gp:1, mpg:18.5, ppg:8.0, rpg:7.0, apg:0.0, spg:0.0, bpg:2.0, tpg:1.0,
              fgPct:0.571, tpPct:0.000, ftPct:0.500 },
      gamelog:[
        { date:"2026-06-27", opp:"TUR", res:"L 71-74", min:18,
          pts:8, reb:7, ast:0, stl:0, blk:2, to:1, fgm:4, fga:7, tpm:0, tpa:0, ftm:0, fta:0 }
      ],
      _sample:true
    }
  ]
};
