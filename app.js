/* Section layout: title, which items belong, whether it starts collapsed,
   and whether to show the item's area tag (useful in the cross-cutting
   "Needs Attention" view). */
const SECTIONS = [
  { id: "needs",    title: "Needs Attention", filter: (i) => i.status === "needs_you", showArea: true,  collapsed: false },
  { id: "tracking", title: "Active Tracking", filter: (i) => i.area === "Tracking" || i.area === "Today", showArea: false, collapsed: false },
  { id: "systems",  title: "Running Systems", filter: (i) => i.area === "Systems", showArea: false, collapsed: false },
  { id: "upcoming", title: "Upcoming",        filter: (i) => i.area === "Upcoming", showArea: false, collapsed: false },
  { id: "closed",   title: "Recently Closed", filter: (i) => i.area === "Closed" || i.status === "done", showArea: false, collapsed: true },
];

const STATUS_LABELS = {
  needs_you: "Needs you",
  on_track: "On track",
  waiting: "Waiting",
  done: "Done",
};

const app = document.getElementById("app");

/* ---------- Data loading ---------- */
async function loadData() {
  const main = document.getElementById("sections");
  main.innerHTML = '<p class="loading">Loading…</p>';
  try {
    // Cache-buster so a cron-overwritten data.json is always fresh.
    const res = await fetch("data.json?v=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    render(data);
  } catch (err) {
    main.innerHTML = '<p class="error-msg">Couldn\'t load data.json (' + err.message + ').</p>';
  }
}

document.getElementById("refresh-btn").addEventListener("click", (e) => {
  e.currentTarget.disabled = true;
  loadData().finally(() => { e.currentTarget.disabled = false; });
});

/* ---------- Rendering ---------- */
function render(data) {
  const items = Array.isArray(data.items) ? data.items : [];

  renderUpdatedAt(data.updated_at);
  renderSummary(items);
  renderSections(items);
}

function renderUpdatedAt(iso) {
  const el = document.getElementById("updated-at");
  if (!iso) { el.textContent = ""; return; }
  const d = new Date(iso);
  if (isNaN(d)) { el.textContent = ""; return; }
  el.textContent = "Updated " + d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function renderSummary(items) {
  const counts = { needs_you: 0, on_track: 0, waiting: 0, done: 0 };
  for (const i of items) {
    if (counts[i.status] !== undefined) counts[i.status]++;
  }
  const tiles = [
    ["needs_you", "Needs you"],
    ["on_track", "On track"],
    ["waiting", "Waiting"],
    ["done", "Done"],
  ];
  document.getElementById("summary").innerHTML = tiles.map(([key, label]) => `
    <div class="stat ${key}">
      <div class="stat-count">${counts[key]}</div>
      <div class="stat-label">${label}</div>
    </div>`).join("");
}

function cardHTML(item, showArea) {
  const label = STATUS_LABELS[item.status] || item.status || "—";
  const area = showArea && item.area ? `<div class="card-area">${escapeHTML(item.area)}</div>` : "";
  return `
    <div class="card ${escapeHTML(item.status || "")}">
      <div class="card-top">
        <div class="card-title">${escapeHTML(item.title || "Untitled")}</div>
        <span class="badge ${escapeHTML(item.status || "")}">${escapeHTML(label)}</span>
      </div>
      ${item.detail ? `<div class="card-detail">${escapeHTML(item.detail)}</div>` : ""}
      ${area}
    </div>`;
}

function renderSections(items) {
  const main = document.getElementById("sections");
  const matched = new Set();
  let html = "";

  for (const sec of SECTIONS) {
    const secItems = items.filter((i) => {
      const hit = sec.filter(i);
      if (hit) matched.add(i.id || i.title);
      return hit;
    });

    const cards = secItems.length
      ? `<div class="cards">${secItems.map((i) => cardHTML(i, sec.showArea)).join("")}</div>`
      : `<p class="empty-note">Nothing here right now.</p>`;

    if (sec.collapsed) {
      html += `
        <section class="section">
          <details class="closed-section">
            <summary><h2>${sec.title}</h2><span class="section-count">${secItems.length}</span></summary>
            ${cards}
          </details>
        </section>`;
    } else {
      html += `
        <section class="section">
          <div class="section-head"><h2>${sec.title}</h2><span class="section-count">${secItems.length}</span></div>
          ${cards}
        </section>`;
    }
  }

  // Fallback: anything that didn't match a section still gets shown.
  const unmatched = items.filter((i) => !matched.has(i.id || i.title));
  if (unmatched.length) {
    html += `
      <section class="section">
        <div class="section-head"><h2>Other</h2><span class="section-count">${unmatched.length}</span></div>
        <div class="cards">${unmatched.map((i) => cardHTML(i, true)).join("")}</div>
      </section>`;
  }

  main.innerHTML = html;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ---------- Boot ---------- */
loadData();
