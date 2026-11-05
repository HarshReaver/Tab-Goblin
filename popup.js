const $ = (sel) => document.querySelector(sel);
const UNITS = { minutes: 60e3, hours: 3600e3, days: 86400e3 };
const state = { tabs: [], dirty: {}, keep: [], sessions: [], feed: { amount: 1, unit: 'days' } };

// Goblin mood depends on how many tabs are open.
const MOODS = [
  { max: 9, name: 'Bored', text: 'Hardly any tabs. The goblin is bored.',
    face: '<path class="ink" d="M28 50h14M58 50h14M40 74h20"/>' },
  { max: 19, name: 'Content', text: 'A tidy number of tabs. The goblin is content.',
    face: '<circle class="fill" cx="36" cy="50" r="4"/><circle class="fill" cx="64" cy="50" r="4"/>' +
           '<path class="ink" d="M38 68Q50 80 62 68"/>' },
  { max: 34, name: 'Hungry', text: 'Lots of tabs. The goblin is getting hungry.',
    face: '<circle class="white" cx="36" cy="50" r="7"/><circle class="white" cx="64" cy="50" r="7"/>' +
          '<circle class="fill" cx="36" cy="50" r="3"/><circle class="fill" cx="64" cy="50" r="3"/>' +
          '<ellipse class="fill" cx="50" cy="74" rx="9" ry="7"/><path class="drool" d="M58 80v9"/>' },
  { max: Infinity, name: 'Ravenous', text: 'Far too many tabs. The goblin is ravenous!',
    face: '<path class="ink" d="M26 38l18 9M74 38l-18 9"/>' +
          '<circle class="fill" cx="36" cy="54" r="4"/><circle class="fill" cx="64" cy="54" r="4"/>' +
          '<path class="fill" d="M32 68Q50 96 68 68Z"/><path class="white" d="M36 68l4 8 4-8M56 68l4 8 4-8"/>' },
];

const goblinSvg = (mood) => `
  <svg viewBox="0 0 100 100" role="img" aria-label="Goblin mood: ${mood.name}">
    <style>
      .ear { fill: #5f9150 } .head { fill: #7fb069 } .fill { fill: #1f2a1a }
      .white { fill: #fff } .ink { stroke: #1f2a1a; stroke-width: 4; stroke-linecap: round; fill: none }
      .drool { stroke: #6fb3d9; stroke-width: 3; stroke-linecap: round }
    </style>
    <polygon class="ear" points="16,52 1,28 32,38"/><polygon class="ear" points="84,52 99,28 68,38"/>
    <circle class="head" cx="50" cy="54" r="34"/>${mood.face}
  </svg>`;

// Small helper to build elements without innerHTML.
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) (k in el ? (el[k] = v) : el.setAttribute(k, v));
  el.append(...kids);
  return el;
}

const hostOf = (url) => { try { return new URL(url).hostname; } catch { return ''; } };
const isKept = (host) => !!host && state.keep.some((k) => host === k || host.endsWith('.' + k));
const say = (text) => { $('#msg').textContent = text; };

function timeAgo(ms) {
  const secs = (Date.now() - ms) / 1000;
  for (const [name, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (secs >= size) { const n = Math.floor(secs / size); return `${n} ${name}${n > 1 ? 's' : ''} ago`; }
  }
  return 'just now';
}

// Why the goblin must not sleep this tab. Empty string means it is fair game.
function blockReason(tab) {
  if (tab.discarded) return 'asleep';
  if (tab.active) return 'current tab';
  if (tab.pinned) return 'pinned';
  if (tab.audible) return 'playing audio';
  if (isKept(hostOf(tab.url))) return 'kept';
  if (state.dirty['dirty:' + tab.id]) return 'unsent form';
  return '';
}

async function load() {
  const [tabs, dirty, store] = await Promise.all([
    chrome.tabs.query({}),
    chrome.storage.session.get(null),
    chrome.storage.local.get({ keep: [], sessions: [], feed: state.feed }),
  ]);
  Object.assign(state, { tabs, dirty }, store);
}

async function refresh() { await load(); render(); }

// ---- Sleeping ----

// Reloads fresh tab info first, so a tab that just started playing audio or got a typed form is spared.
async function sleepTabs(ids) {
  await load();
  let slept = 0;
  const spared = new Set();
  for (const id of ids) {
    const tab = state.tabs.find((t) => t.id === id);
    const reason = tab && blockReason(tab);
    if (!tab || reason) { spared.add(reason || 'gone'); continue; }
    const result = await chrome.tabs.discard(id).catch(() => null);
    if (result) slept++; else spared.add('could not sleep');
  }
  say(`The goblin ate ${slept} tab${slept === 1 ? '' : 's'}.` +
      (spared.size ? ` Spared: ${[...spared].join(', ')}.` : ''));
  render();
}

function feedCandidates() {
  const limit = state.feed.amount * UNITS[state.feed.unit];
  return state.tabs
    .filter((t) => !blockReason(t) && Date.now() - (t.lastAccessed ?? Date.now()) >= limit)
    .map((t) => t.id);
}

// ---- Tabs panel ----

async function switchTo(tab) {
  await chrome.tabs.update(tab.id, { active: true }); // Chrome reloads a sleeping tab by itself
  await chrome.windows.update(tab.windowId, { focused: true });
  window.close();
}

async function toggleKeep(host) {
  const keep = state.keep.includes(host) ? state.keep.filter((k) => k !== host) : [...state.keep, host];
  await chrome.storage.local.set({ keep });
  await refresh();
}

function tabRow(tab) {
  const reason = blockReason(tab);
  const host = hostOf(tab.url);
  const meta = h('span', { className: 'meta' }, `${host || 'no site'} - ${timeAgo(tab.lastAccessed ?? Date.now())}`);
  if (reason) meta.append(' - ', h('span', { className: 'badge' }, reason));

  const actions = h('span', { className: 'actions' },
    h('button', { textContent: 'Sleep', disabled: !!reason, title: reason ? `Cannot sleep: ${reason}` : 'Put this tab to sleep',
                  onclick: () => sleepTabs([tab.id]) }));
  if (host) {
    const kept = state.keep.includes(host);
    actions.append(h('button', { textContent: kept ? 'Unkeep' : 'Keep', title: `${kept ? 'Remove' : 'Add'} ${host} ${kept ? 'from' : 'to'} the Keep list`,
                                 onclick: () => toggleKeep(host) }));
  }
  return h('li', { className: tab.discarded ? 'asleep' : '' },
    h('button', { className: 'tab-main', title: tab.url, onclick: () => switchTo(tab) },
      h('span', { className: 'title' }, tab.title || tab.url || 'New tab'), meta),
    actions);
}

function renderTabs() {
  const oldestFirst = [...state.tabs].sort((a, b) => (a.lastAccessed ?? Date.now()) - (b.lastAccessed ?? Date.now()));
  $('#tabList').replaceChildren(...oldestFirst.map(tabRow));
  const n = feedCandidates().length;
  $('#feedBtn').textContent = `Feed the goblin (${n} tab${n === 1 ? '' : 's'})`;
  $('#feedBtn').disabled = n === 0;
}

function renderHeader() {
  const total = state.tabs.length;
  const asleep = state.tabs.filter((t) => t.discarded).length;
  const mood = MOODS.find((m) => total <= m.max);
  $('#goblin').innerHTML = goblinSvg(mood);
  $('#count').textContent = `${total} tab${total === 1 ? '' : 's'} open, ${asleep} asleep`;
  $('#mood').textContent = mood.text;
}

// ---- Keep list panel ----

function renderKeep() {
  $('#keepList').replaceChildren(...(state.keep.length ? state.keep : []).map((host) =>
    h('li', {}, h('span', { className: 'title' }, host),
      h('button', { textContent: 'Remove from Keep list', onclick: () => toggleKeep(host) }))));
  if (!state.keep.length) $('#keepList').append(h('li', {}, h('span', { className: 'meta' }, 'No sites on the Keep list yet.')));
}

// ---- Sessions panel ----

async function saveSessions(sessions) {
  await chrome.storage.local.set({ sessions });
  await refresh();
}

async function restore(session) {
  const urls = session.tabs.map((t) => t.url).filter((u) => /^(https?|file):/.test(u));
  if (!urls.length) return say('Nothing to restore: no web addresses in this session.');
  await chrome.windows.create({ url: urls });
  say(`Restored ${urls.length} of ${session.tabs.length} tabs in a new window.`);
}

function renderSessions() {
  const rows = state.sessions.map((s) => h('li', {},
    h('span', { className: 'tab-main' },
      h('span', { className: 'title' }, s.name),
      h('span', { className: 'meta' }, `${s.tabs.length} tabs - saved ${new Date(s.date).toLocaleString()}`)),
    h('span', { className: 'actions' },
      h('button', { textContent: 'Restore in new window', onclick: () => restore(s) }),
      h('button', { textContent: 'Delete', onclick: () => saveSessions(state.sessions.filter((x) => x.date !== s.date)) }))));
  $('#sessionList').replaceChildren(...rows);
  if (!rows.length) $('#sessionList').append(h('li', {}, h('span', { className: 'meta' }, 'No saved sessions yet.')));
}

function render() { renderHeader(); renderTabs(); renderKeep(); renderSessions(); }

// ---- Events ----

document.querySelectorAll('nav button').forEach((btn) => btn.addEventListener('click', () => {
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b === btn));
  document.querySelectorAll('section').forEach((s) => { s.hidden = s.id !== btn.dataset.panel; });
}));

async function feedChanged() {
  const amount = Math.max(1, Number($('#amount').value) || 1);
  state.feed = { amount, unit: $('#unit').value };
  await chrome.storage.local.set({ feed: state.feed });
  renderTabs();
}
$('#amount').addEventListener('input', feedChanged);
$('#unit').addEventListener('change', feedChanged);

$('#feedForm').addEventListener('submit', (e) => { e.preventDefault(); sleepTabs(feedCandidates()); });

$('#keepForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const raw = $('#keepHost').value.trim().toLowerCase();
  const host = hostOf(raw.includes('://') ? raw : 'https://' + raw);
  if (host && !state.keep.includes(host)) await chrome.storage.local.set({ keep: [...state.keep, host] });
  $('#keepHost').value = '';
  await refresh();
});

$('#saveForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tabs = state.tabs.map((t) => ({ url: t.url || t.pendingUrl || '', title: t.title || '' })).filter((t) => t.url);
  const session = { name: $('#sessionName').value.trim(), date: Date.now(), tabs };
  $('#sessionName').value = '';
  await saveSessions([session, ...state.sessions]);
  say(`Saved "${session.name}" with ${tabs.length} tabs.`);
});

load().then(() => {
  $('#amount').value = state.feed.amount;
  $('#unit').value = state.feed.unit;
  render();
});
