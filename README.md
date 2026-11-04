# NCRP Death Race

Schedule, results and standings site for the NCRP Death Race series. Plain HTML/CSS/JS — no build step — hosted on GitHub Pages.

## Put it online (GitHub Pages)

1. Create a new **public** repo on GitHub (e.g. `ncrp-deathrace`).
2. Upload everything in this folder to the repo root (`index.html`, `style.css`, `app.js`, `.nojekyll`, `data/races.json`).
3. Repo → **Settings → Pages** → *Source: Deploy from a branch* → branch `main`, folder `/ (root)` → **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Posting results

Everything lives in **`data/races.json`**. On GitHub, open that file, click the ✏️ pencil, edit, and **Commit changes**. The site updates within a minute or two.

### After a race finishes

Change the race's `"status"` from `"upcoming"` to `"finished"` and fill in `"results"`:

```json
{
  "number": 3,
  "name": "Tunnel Trouble",
  "start": "2026-11-06T02:00:00Z",
  "location": "[REDACTED]",
  "terrain": "Badlands sprint",
  "buyIn": 10000,
  "prize": "Winner takes all",
  "status": "finished",
  "notes": "Optional race recap shown under the table.",
  "results": [
    { "pos": 1, "driver": "Driver Name", "ride": "Their car", "time": "4:12.33" },
    { "pos": 2, "driver": "Another Driver", "ride": "Their car", "time": "+3.10" },
    { "pos": null, "status": "Wrecked", "driver": "Unlucky Choom", "ride": "Their car", "note": "Took the tunnel wall at CP2" }
  ]
}
```

- `pos`: finishing position as a number. Use `null` for anyone who didn't finish, and put the reason in `status` (`"Wrecked"`, `"DNF"`, `"DQ"`, `"Flatlined"`…).
- `ride`, `time`, `note` are optional.
- Standings count **wins** only, calculated automatically from every finished race. Spell driver names the same way each time so they add up.
- Only the winner matters? Just list one result: `{ "pos": 1, "driver": "Name" }` — the site shows the winner bar and skips the table.
- Leave out `start` (or set it to `null`) and the date shows as **DATA CORRUPTED**.

### Announcing the next race

Add a new object to the `"races"` list with `"status": "upcoming"` and `"results": []`. The **Next race** card shows the soonest upcoming race, with a live countdown and the start time converted to each visitor's own time zone.

`start` is in **UTC** (the `Z` at the end). Quick conversion: EST + 5 hours = UTC (EDT + 4 in summer). 9 PM EST on Nov 5 → `2026-11-06T02:00:00Z`.

### JSON gotchas

- Every item in a list needs a comma after it — except the last one.
- Text goes in "double quotes"; numbers and `null` don't.
- If the site shows *"Could not load data/races.json"*, paste the file into <https://jsonlint.com> to find the typo.

## Previewing on your computer

Opening `index.html` directly won't load the data (browsers block it). From this folder run:

```
python -m http.server
```

then open <http://localhost:8000>.
