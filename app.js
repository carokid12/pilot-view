// Life Suite homepage v2
// Real today: Weeks Left (computed), status cards (data.json, refreshed by Muse),
// module map. Tasks/To Do plugs in from Supabase with the Tasks module build.

// ---------- Weeks Left (born Feb 1995, planning horizon age 80) ----------
(function () {
  var birth = new Date(1995, 1, 15);          // mid-Feb 1995 (exact day was declined; precise enough)
  var eighty = new Date(2075, 1, 15);
  var now = new Date();
  var weekMs = 7 * 24 * 3600 * 1000;
  var total = Math.round((eighty - birth) / weekMs);
  var lived = Math.floor((now - birth) / weekMs);
  var left = total - lived;
  document.getElementById('weeksLeft').textContent = left.toLocaleString('en-US');
  document.getElementById('weeksSub').textContent =
    lived.toLocaleString('en-US') + ' lived of ~' + total.toLocaleString('en-US') + ' weeks (to age 80)';
  document.getElementById('weeksFill').style.width = (100 * lived / total).toFixed(1) + '%';
})();

// ---------- Dateline + mode pill ----------
(function () {
  var now = new Date();
  document.getElementById('dateline').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  var btn = document.getElementById('modeToggle');
  var hour = now.getHours(), day = now.getDay();
  var workHours = day >= 1 && day <= 5 && hour >= 8 && hour < 17;
  setMode(workHours ? 'Work' : 'Personal');
  btn.addEventListener('click', function () {
    setMode(btn.textContent === 'Work' ? 'Personal' : 'Work');
  });
  function setMode(m) {
    btn.textContent = m;
    btn.classList.toggle('work', m === 'Work');
  }
})();

// ---------- Module map ----------
var MODULES = [
  { name: 'Tasks', tag: 'Building', cls: 'building',
    desc: 'Your Tweek, rebuilt natively — week view, frog/gold priorities, subtasks as reminders. Phase 1, in progress.' },
  { name: 'CRM — People', tag: 'Planned', cls: '',
    desc: 'People Queue (who to text, from your message history), birthday → gift pipeline, Monica-style person profiles.' },
  { name: 'Health & Fitness', tag: 'Planned', cls: '',
    desc: 'Journal, health cadence and appointments, meal planning under 1,600 cal, weekly check-in. Sleep waits on a wearable you will actually wear.' },
  { name: 'Admin', tag: 'Planned', cls: '',
    desc: 'Chore routines, inventory with reorder points, deliveries, returns and errands queues.' },
  { name: 'Buying & Consume', tag: 'Planned', cls: '',
    desc: 'The buying agent dump spot, grocery and To Buy lists, and your mymind saves flowing into one inbox.' },
  { name: 'Money', tag: 'Planned', cls: '',
    desc: 'Firefly III model: budgets, piggy banks, bills matched when paid, rules that categorize automatically from your bank feed.' },
  { name: 'What Should I Do?', tag: 'Retained', cls: 'retained',
    desc: 'Your activity picker (46 activities, 6 categories) — source copied from Netlify, rebuilds inside Fun & Recreation.' },
  { name: 'COCKPIT', tag: 'Live (lite)', cls: 'live',
    desc: 'Integration health and automations running — the Running Systems section above is its first version.' }
];
(function () {
  var wrap = document.getElementById('modules');
  MODULES.forEach(function (m) {
    var d = document.createElement('div');
    d.className = 'module';
    d.innerHTML = '<h3>' + m.name + ' <span class="pill ' + m.cls + '">' + m.tag + '</span></h3><p>' + m.desc + '</p>';
    wrap.appendChild(d);
  });
})();

// ---------- Status cards from data.json ----------
// data.json shape: { updated_at, items: [{ id, title, detail, status, area }] }
// status: needs_you | active | on_track | waiting | stale | done
// area:   Today | Tracking | Systems | Upcoming | Closed
(function () {
  var LABEL = { needs_you: 'Needs you', active: 'Active', on_track: 'On track',
                waiting: 'Waiting', stale: 'Stale', done: 'Done' };
  fetch('data.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var items = data.items || [];
      var counts = { needs_you: 0, active: 0, on_track: 0, waiting: 0, stale: 0 };
      items.forEach(function (it) { if (counts[it.status] !== undefined) counts[it.status]++; });

      function render(secId, countId, list) {
        var el = document.getElementById(secId);
        var cEl = document.getElementById(countId);
        if (cEl) cEl.textContent = '(' + list.length + ')';
        list.forEach(function (it) {
          var d = document.createElement('div');
          d.className = 'card';
          d.innerHTML = '<h3>' + it.title + '</h3><p>' + (it.detail || '') + '</p>' +
            '<span class="status ' + it.status.replace('_', '-') + '">' + (LABEL[it.status] || it.status) + '</span>';
          el.appendChild(d);
        });
      }
      render('sec-needs', 'count-needs', items.filter(function (i) { return i.status === 'needs_you'; }));
      render('sec-active', 'count-active', items.filter(function (i) { return i.area === 'Tracking' && i.status !== 'needs_you'; }));
      render('sec-running', 'count-running', items.filter(function (i) { return i.area === 'Systems'; }));
      render('sec-upcoming', 'count-upcoming', items.filter(function (i) { return i.area === 'Upcoming'; }));
      render('sec-closed', 'count-closed', items.filter(function (i) { return i.area === 'Closed' || i.status === 'done'; }));

      document.getElementById('summary').innerHTML =
        tile(counts.needs_you, 'Needs you', 'needs') + tile(counts.active, 'Active', 'active') +
        tile(counts.on_track, 'On track', 'on') + tile(counts.waiting, 'Waiting', 'wait') +
        tile(counts.stale, 'Stale', 'stale');
      if (data.updated_at) {
        document.getElementById('updated').textContent =
          'status data ' + new Date(data.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      function tile(n, label, cls) {
        return '<div class="tile ' + cls + '"><b>' + n + '</b><span>' + label + '</span></div>';
      }
    })
    .catch(function () { /* data.json missing: homepage still renders */ });
})();
