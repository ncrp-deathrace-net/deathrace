// NCRP Death Race — renders data/races.json into the page.
// All text from the data file is inserted with textContent, never as HTML.

(function () {
  'use strict';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }
  function eventTag(race) { return 'EVENT #' + pad2(race.number); }

  function formatEddies(n) {
    if (typeof n !== 'number') return n || '—';
    return '€$ ' + n.toLocaleString('en-US');
  }

  function formatLocal(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso || 'TBA';
    return d.toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (!iso || isNaN(d)) return 'DATA CORRUPTED';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // A result counts as finishing if it has a numeric position.
  function isFinisher(r) { return typeof r.pos === 'number'; }

  // ---------- Next race ----------
  function renderNext(races, contact) {
    var box = document.getElementById('next-race');
    box.textContent = '';
    var upcoming = races
      .filter(function (r) { return r.status === 'upcoming'; })
      .sort(function (a, b) { return new Date(a.start) - new Date(b.start); })[0];

    if (!upcoming) {
      box.appendChild(el('p', { class: 'empty', text: 'No race on the board. Watch Discord for the next one.' }));
      return;
    }

    var countdown = el('div', { class: 'countdown', 'aria-live': 'off' }, [
      el('small', { text: 'LIGHTS OUT IN' }),
      el('span', { id: 'countdown-value', text: '—' })
    ]);

    box.appendChild(el('div', { class: 'next-head' }, [
      el('div', null, [
        el('p', { class: 'event-tag', text: eventTag(upcoming) + (upcoming.terrain ? ' // ' + upcoming.terrain.toUpperCase() : '') }),
        el('h3', { class: 'race-name', text: upcoming.name })
      ]),
      countdown
    ]));

    var facts = [
      ['WHEN (YOUR TIME)', formatLocal(upcoming.start), false],
      ['START LINE', upcoming.location || 'TBA', false],
      ['BUY-IN', formatEddies(upcoming.buyIn), false],
      ['PRIZE', upcoming.prize || 'TBA', true]
    ];
    box.appendChild(el('div', { class: 'facts' }, facts.map(function (f) {
      return el('div', { class: 'fact' }, [
        el('span', { class: 'fact-label', text: f[0] }),
        el('span', { class: 'fact-value' + (f[2] ? ' hot' : ''), text: f[1] })
      ]);
    })));

    box.appendChild(el('div', { class: 'signup' }, [
      el('strong', { text: 'Sign up →' }),
      el('span', { text: 'CONTACT ' + (contact || 'THE ORGANIZER').toUpperCase() })
    ]));

    startCountdown(new Date(upcoming.start));
  }

  function startCountdown(target) {
    var out = document.getElementById('countdown-value');
    if (!out || isNaN(target)) return;
    function tick() {
      var ms = target - Date.now();
      if (ms <= 0) { out.textContent = 'RACE ON'; return; }
      var s = Math.floor(ms / 1000);
      var d = Math.floor(s / 86400);
      var h = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60);
      var sec = s % 60;
      out.textContent = (d > 0 ? d + 'D ' : '') + pad2(h) + 'H ' + pad2(m) + 'M ' + pad2(sec) + 'S';
      setTimeout(tick, 1000);
    }
    tick();
  }

  // ---------- Results ----------
  function renderResults(races) {
    var box = document.getElementById('results-list');
    box.textContent = '';
    var done = races
      .filter(function (r) { return r.status === 'finished'; })
      .sort(function (a, b) { return b.number - a.number; });

    if (!done.length) {
      box.appendChild(el('p', { class: 'empty', text: 'No results posted yet. First blood pending.' }));
      return;
    }

    done.forEach(function (race, i) {
      var results = (race.results || []).slice().sort(function (a, b) {
        if (isFinisher(a) && isFinisher(b)) return a.pos - b.pos;
        if (isFinisher(a)) return -1;
        if (isFinisher(b)) return 1;
        return 0;
      });
      var winner = results.filter(function (r) { return r.pos === 1; })[0];

      var details = el('details', { class: 'race-result' });
      if (i === 0) details.open = true;

      details.appendChild(el('summary', null, [
        el('h3', null, [el('span', { class: 'num', text: '#' + pad2(race.number) }), race.name]),
        el('span', { class: 'summary-meta' }, [
          el('span', { class: race.start ? '' : 'corrupt', text: formatDate(race.start) }),
          el('span', { class: 'toggle', text: 'RESULTS' })
        ])
      ]));

      if (winner) {
        details.appendChild(el('div', { class: 'winner' }, [
          el('span', { class: 'label', text: 'WINNER' }),
          el('span', { class: 'name', text: winner.driver }),
          winner.ride ? el('span', { class: 'ride', text: winner.ride }) : null
        ]));
      }

      var rows = results.map(function (r) {
        var out = !isFinisher(r);
        return el('tr', { class: out ? 'out' : '' }, [
          el('td', { class: 'pos' }, [out ? el('span', { class: 'badge', text: (r.status || 'DNF').toUpperCase() }) : 'P' + r.pos]),
          el('td', { class: 'driver', text: r.driver || '—' }),
          el('td', { text: r.ride || '—' }),
          el('td', { text: r.time || '—' }),
          el('td', { class: 'note', text: r.note || '' })
        ]);
      });

      // Winner-only results: the red bar says it all, skip the table.
      if (!(winner && results.length === 1)) details.appendChild(el('div', { class: 'table-wrap' }, [
        el('table', null, [
          el('thead', null, [el('tr', null, ['POS', 'DRIVER', 'RIDE', 'TIME', 'NOTES'].map(function (h) {
            return el('th', { scope: 'col', text: h });
          }))]),
          el('tbody', null, rows)
        ])
      ]));

      if (race.notes) details.appendChild(el('p', { class: 'race-notes', text: race.notes }));

      box.appendChild(details);
    });
  }

  // ---------- Standings (wins only) ----------
  function renderStandings(races) {
    var box = document.getElementById('standings-table');
    box.textContent = '';
    var drivers = {};
    races.filter(function (r) { return r.status === 'finished'; }).forEach(function (race) {
      (race.results || []).forEach(function (r) {
        if (r.pos !== 1 || !r.driver) return;
        var key = r.driver.trim().toLowerCase();
        var d = drivers[key] || (drivers[key] = { name: r.driver.trim(), wins: 0, races: [] });
        d.wins++;
        d.races.push('#' + pad2(race.number) + ' ' + race.name);
      });
    });

    var list = Object.keys(drivers).map(function (k) { return drivers[k]; }).sort(function (a, b) {
      return b.wins - a.wins || a.name.localeCompare(b.name);
    });

    if (!list.length) {
      box.appendChild(el('p', { class: 'empty', text: 'Standings appear once the first winner is crowned.' }));
      return;
    }

    box.appendChild(el('div', { class: 'table-wrap race-result' }, [
      el('table', null, [
        el('thead', null, [el('tr', null, ['RANK', 'DRIVER', 'WINS', 'WON'].map(function (h) {
          return el('th', { scope: 'col', text: h });
        }))]),
        el('tbody', null, list.map(function (d, i) {
          return el('tr', null, [
            el('td', { class: 'pos', text: pad2(i + 1) }),
            el('td', { class: 'driver', text: d.name }),
            el('td', { text: String(d.wins) }),
            el('td', { class: 'note', text: d.races.join(' / ') })
          ]);
        }))
      ])
    ]));
  }

  // ---------- Boot ----------
  fetch('data/races.json', { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var races = data.races || [];
            renderNext(races, data.contact);
      renderResults(races);
      renderStandings(races);
    })
    .catch(function (err) {
      var msg = 'Could not load data/races.json (' + err.message + '). If you opened this file directly, run a local server instead — see README.';
      ['next-race', 'results-list', 'standings-table'].forEach(function (id) {
        var box = document.getElementById(id);
        box.textContent = '';
        box.appendChild(el('p', { class: 'empty', text: msg }));
      });
    });
})();
