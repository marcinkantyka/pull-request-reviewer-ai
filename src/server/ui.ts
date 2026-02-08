export interface UiRenderOptions {
  version: string;
  host: string;
  port: number;
}

export function renderUI(options: UiRenderOptions): string {
  const css = String.raw`
:root {
  color-scheme: light;
  --bg: #f6f8fa;
  --surface: #ffffff;
  --text: #24292f;
  --muted: #57606a;
  --border: #d0d7de;
  --accent: #0969da;
  --accent-strong: #0550ae;
  --accent-soft: #ddf4ff;
  --highlight: #ffdfb6;
  --critical: #cf222e;
  --high: #bc4c00;
  --medium: #bf8700;
  --low: #1a7f37;
  --info: #0969da;
  --shadow: 0 1px 0 rgba(27, 31, 36, 0.04), 0 1px 3px rgba(27, 31, 36, 0.12);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
}

* {
  box-sizing: border-box;
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  color: var(--text);
  background: var(--bg);
}

code, pre, .mono {
  font-family: "JetBrains Mono", "SF Mono", ui-monospace, monospace;
}

.app {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.brand h1 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0.2px;
}

.brand .tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 4px 10px;
  border-radius: 999px;
  width: fit-content;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav button {
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
}

.nav button.active {
  border-color: var(--border);
  background: #f3f6f7;
  color: var(--text);
  font-weight: 600;
}

.sidebar .version {
  margin-top: auto;
  font-size: 12px;
  color: var(--muted);
}

.main {
  padding: 28px 36px 40px 36px;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 6px 0;
  font-size: 26px;
}

.header p {
  margin: 0;
  color: var(--muted);
}

.status-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  min-width: 220px;
  box-shadow: var(--shadow);
  animation: floatIn 0.45s ease both;
}

.status-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
}

.status-row strong {
  color: var(--text);
}

.grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 20px;
}

.section-stack {
  display: grid;
  gap: 20px;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 22px;
  box-shadow: var(--shadow);
  animation: floatIn 0.55s ease both;
}

.panel h3 {
  margin: 0 0 18px 0;
  font-size: 18px;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.row-inline {
  display: flex;
  gap: 8px;
  align-items: center;
}

.row-inline input,
.row-inline select {
  flex: 1;
}

.mini {
  padding: 8px 10px;
  font-size: 12px;
}

.helper {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}

input, select, textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  background: #fff;
  color: var(--text);
  outline: none;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(28, 124, 140, 0.12);
}

textarea {
  min-height: 70px;
  resize: vertical;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

button.primary {
  background: var(--accent);
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}

button.secondary {
  background: #f6f8fa;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.preview {
  background: #f6f8fa;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  padding: 10px;
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
  white-space: pre-wrap;
}

.summary-box {
  background: #f6f8fa;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  word-break: break-word;
}

.summary-box p {
  margin: 0 0 8px 0;
}

.summary-box ul {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
}

.summary-box li {
  margin-bottom: 4px;
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.kpi {
  background: #f8fafb;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
}

.kpi span {
  display: block;
  font-size: 12px;
  color: var(--muted);
}

.kpi strong {
  font-size: 20px;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.badge.critical { background: var(--critical); }
.badge.high { background: var(--high); }
.badge.medium { background: var(--medium); color: #1f1f1f; }
.badge.low { background: var(--low); }
.badge.info { background: var(--info); }

.issue {
  border-top: 1px solid var(--border);
  padding: 12px 0;
}

.issue:first-child {
  border-top: none;
}

.issue h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
}

.issue p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.issue-code {
  margin-top: 8px;
  background: #f6f8fa;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 12px;
  color: #2c3e50;
  white-space: pre-wrap;
}

.file-block {
  margin-top: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}

.file-block h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row span {
  color: var(--muted);
}

.settings-row strong {
  font-weight: 600;
}

.browser {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
}

.browser-panel {
  width: min(640px, 90vw);
  max-height: 70vh;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.browser-path {
  font-size: 12px;
  color: var(--muted);
}

.browser-list {
  padding: 12px 18px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.browser-item {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: #f8fafb;
  cursor: pointer;
  font-size: 13px;
}

.browser-item:hover {
  border-color: var(--accent);
  background: #eef7f8;
}

.muted {
  color: var(--muted);
  font-size: 12px;
}

.muted.success {
  color: var(--low);
}

.muted.error {
  color: var(--critical);
}

.hidden {
  display: none;
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .sidebar {
    display: none;
  }
  .app {
    grid-template-columns: 1fr;
  }
}
`;

  const js = String.raw`
const state = {
  defaults: null,
  version: ${JSON.stringify(options.version)},
  server: ${JSON.stringify({ host: options.host, port: options.port })},
  cwd: '',
  history: [],
};

const byId = (id) => document.getElementById(id);

const fields = {
  mode: byId('mode'),
  repoPath: byId('repoPath'),
  baseBranch: byId('baseBranch'),
  sourceBranch: byId('sourceBranch'),
  targetBranch: byId('targetBranch'),
  files: byId('files'),
  maxFiles: byId('maxFiles'),
  severity: byId('severity'),
  timeout: byId('timeout'),
  endpoint: byId('endpoint'),
  model: byId('model'),
  allowedHosts: byId('allowedHosts'),
  includeAll: byId('includeAll'),
  configPath: byId('configPath'),
};

const statusEl = byId('statusText');
const previewEl = byId('commandPreview');
const resultsEl = byId('results');
const summaryEl = byId('summary');
const changeSummaryEl = byId('changeSummary');
const issuesEl = byId('issues');
const emptyStateEl = byId('emptyState');
const allowedSeverities = new Set(['critical', 'high', 'medium', 'low', 'info']);
const modelListEl = byId('modelList');
const modelStatusEl = byId('modelStatus');
const browseButtonEl = byId('browseRepo');
const useCwdButtonEl = byId('useCwd');
const browserEl = byId('browser');
const browserListEl = byId('browserList');
const browserPathEl = byId('browserPath');
const browserUpEl = byId('browserUp');
const browserSelectEl = byId('browserSelect');
const browserCloseEl = byId('browserClose');
const historyListEl = byId('historyList');
const settingsListEl = byId('settingsList');
const navButtons = document.querySelectorAll('.nav button[data-target]');
let browserCurrentPath = '';
let browserParentPath = null;

function setStatus(text, tone = 'muted') {
  statusEl.textContent = text;
  statusEl.className = 'muted ' + tone;
}

function updateModeFields() {
  const mode = fields.mode.value;
  const compareFields = document.querySelectorAll('[data-mode="compare"]');
  const baseFields = document.querySelectorAll('[data-mode="base"]');

  compareFields.forEach((el) => el.classList.toggle('hidden', mode !== 'compare'));
  baseFields.forEach((el) => el.classList.toggle('hidden', mode === 'compare'));

  updatePreview();
}

function buildCommandPreview() {
  const mode = fields.mode.value;
  const repo = fields.repoPath.value.trim();
  const files = fields.files.value.trim();
  const maxFiles = fields.maxFiles.value.trim();
  const severity = fields.severity.value;
  const timeout = fields.timeout.value.trim();
  const base = fields.baseBranch.value.trim();
  const source = fields.sourceBranch.value.trim();
  const target = fields.targetBranch.value.trim();

  let cmd = 'pr-review';
  if (mode === 'compare') {
    cmd += ' compare ' + (source || '<source>') + ' ' + (target || '<target>');
  } else {
    cmd += ' review --base ' + (base || 'main');
  }
  if (repo) cmd += ' --repo-path ' + repo;
  if (files) cmd += ' --files \"' + files + '\"';
  if (maxFiles) cmd += ' --max-files ' + maxFiles;
  if (severity && severity !== 'all') cmd += ' --severity ' + severity;
  if (timeout) cmd += ' --timeout ' + timeout;
  return cmd;
}

function updatePreview() {
  previewEl.textContent = buildCommandPreview();
}

function setActiveNav(targetId) {
  navButtons.forEach((button) => {
    const isActive = button.dataset.target === targetId;
    button.classList.toggle('active', isActive);
  });
}

function scrollToPanel(targetId) {
  const panel = document.getElementById(targetId);
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderChangeSummary(narrative) {
  changeSummaryEl.innerHTML = '';
  const lines = String(narrative || '').split('\\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    changeSummaryEl.textContent = 'No change summary available.';
    return;
  }

  const intro = document.createElement('p');
  intro.textContent = lines[0];
  changeSummaryEl.appendChild(intro);

  if (lines.length > 1) {
    const list = document.createElement('ul');
    lines.slice(1).forEach((line) => {
      const item = document.createElement('li');
      item.textContent = line.replace(/^[-•]\\s*/, '');
      list.appendChild(item);
    });
    changeSummaryEl.appendChild(list);
  }
}

function renderHistory() {
  historyListEl.innerHTML = '';
  if (!state.history.length) {
    historyListEl.innerHTML = '<p class="muted">No reviews yet.</p>';
    return;
  }

  state.history.slice().reverse().forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'file-block';

    const title = document.createElement('h4');
    title.textContent = entry.title;
    const meta = document.createElement('div');
    meta.className = 'muted';
    meta.textContent = entry.meta;

    row.appendChild(title);
    row.appendChild(meta);
    historyListEl.appendChild(row);
  });
}

function renderSettings() {
  settingsListEl.innerHTML = '';
  if (!state.defaults) {
    settingsListEl.innerHTML = '<p class="muted">Settings are not available.</p>';
    return;
  }

  const items = [
    { label: 'LLM endpoint', value: state.defaults.llm.endpoint },
    { label: 'LLM provider', value: state.defaults.llm.provider },
    { label: 'LLM model', value: state.defaults.llm.model },
    { label: 'Timeout (ms)', value: state.defaults.llm.timeout },
    { label: 'Max files', value: state.defaults.review.maxFiles },
    { label: 'Include all files', value: state.defaults.review.includeAllFiles ? 'true' : 'false' },
    { label: 'Allowed hosts', value: (state.defaults.network.allowedHosts || []).join(', ') },
  ];

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'settings-row';
    const label = document.createElement('span');
    label.textContent = item.label;
    const value = document.createElement('strong');
    value.textContent = String(item.value);
    row.appendChild(label);
    row.appendChild(value);
    settingsListEl.appendChild(row);
  });
}

async function loadModels() {
  modelStatusEl.textContent = 'Loading models...';
  modelListEl.innerHTML = '<option value="">Select a model</option>';

  const endpoint = fields.endpoint.value.trim();
  const url = endpoint ? '/api/models?endpoint=' + encodeURIComponent(endpoint) : '/api/models';
  const res = await fetch(url);
  const data = await res.json();

  if (!data.ok) {
    modelStatusEl.textContent = 'Failed to load models.';
    return;
  }

  if (!data.supported) {
    modelStatusEl.textContent = 'Model list not available for this provider.';
    return;
  }

  if (!data.models || data.models.length === 0) {
    modelStatusEl.textContent = 'No models found.';
    return;
  }

  data.models.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    modelListEl.appendChild(option);
  });

  modelStatusEl.textContent = 'Select a model from the list or keep a custom value.';
}

async function loadDirectory(path) {
  const url = path ? '/api/fs?path=' + encodeURIComponent(path) : '/api/fs';
  const res = await fetch(url);
  const data = await res.json();

  if (!data.ok) {
    browserListEl.innerHTML = '<div class="muted">Unable to load directory.</div>';
    return;
  }

  browserCurrentPath = data.path;
  browserPathEl.textContent = data.path;
  browserParentPath = data.parent || null;
  browserUpEl.disabled = !browserParentPath;

  browserListEl.innerHTML = '';
  if (!data.entries || data.entries.length === 0) {
    browserListEl.innerHTML = '<div class="muted">No subdirectories.</div>';
    return;
  }

  data.entries.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'browser-item';
    item.textContent = entry.name;
    item.addEventListener('click', () => loadDirectory(entry.path));
    browserListEl.appendChild(item);
  });
}

function openBrowser() {
  const start = fields.repoPath.value.trim() || state.cwd || '';
  browserEl.classList.remove('hidden');
  loadDirectory(start);
}

function closeBrowser() {
  browserEl.classList.add('hidden');
}

async function loadDefaults() {
  const res = await fetch('/api/defaults');
  const data = await res.json();
  if (!data.ok) {
    setStatus('Failed to load defaults.', 'error');
    return;
  }
  state.defaults = data.defaults;
  state.cwd = data.meta && data.meta.cwd ? data.meta.cwd : '';

  const { llm, network, review } = data.defaults;
  fields.endpoint.value = llm.endpoint || '';
  fields.model.value = llm.model || '';
  fields.allowedHosts.value = (network.allowedHosts || []).join(',');
  fields.maxFiles.value = String(review.maxFiles ?? '');
  fields.severity.value = 'all';
  fields.timeout.value = String(Math.round((llm.timeout || 60000) / 1000));
  fields.includeAll.checked = review.includeAllFiles ?? false;
  fields.mode.value = 'base';
  if (!fields.repoPath.value.trim() && state.cwd) {
    fields.repoPath.value = state.cwd;
  }

  updateModeFields();
  updatePreview();
  renderSettings();
  loadModels();
}

function renderResults(result) {
  resultsEl.classList.remove('hidden');
  emptyStateEl.classList.add('hidden');

  summaryEl.innerHTML = '';
  const kpis = [
    { label: 'Files reviewed', value: result.summary.filesReviewed },
    { label: 'Total issues', value: result.summary.totalIssues },
    { label: 'Score', value: result.summary.score },
  ];
  kpis.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'kpi';
    const label = document.createElement('span');
    label.textContent = item.label;
    const value = document.createElement('strong');
    value.textContent = String(item.value);
    card.appendChild(label);
    card.appendChild(value);
    summaryEl.appendChild(card);
  });

  let narrative = result.changeSummary?.narrative || 'No change summary available.';
  if (result.summary.filesReviewed === 0) {
    narrative +=
      ' No committed changes detected between branches. If you expected changes, commit them or switch branches.';
  }
  renderChangeSummary(narrative);

  issuesEl.innerHTML = '';
  if (!result.files || result.files.length === 0) {
    issuesEl.innerHTML = '<p class="muted">No issues reported.</p>';
    return;
  }

  result.files.forEach((file) => {
    const block = document.createElement('div');
    block.className = 'file-block';
    const issues = file.issues || [];
    const title = document.createElement('h4');
    title.textContent = file.path;
    const meta = document.createElement('div');
    meta.className = 'muted';
    meta.textContent =
      '+' + file.additions + ' -' + file.deletions + ' | ' + issues.length + ' issues';
    block.appendChild(title);
    block.appendChild(meta);

    issues.forEach((issue) => {
      const issueEl = document.createElement('div');
      issueEl.className = 'issue';
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.gap = '8px';
      header.style.marginBottom = '6px';

      const severity = allowedSeverities.has(issue.severity) ? issue.severity : 'info';
      const badge = document.createElement('span');
      badge.className = 'badge ' + severity;
      badge.textContent = String(severity).toUpperCase();

      const strong = document.createElement('strong');
      strong.textContent = issue.category || 'Issue';

      header.appendChild(badge);
      header.appendChild(strong);

      const desc = document.createElement('p');
      const message = issue.message || '';
      desc.textContent = message || 'No description provided.';

      issueEl.appendChild(header);
      issueEl.appendChild(desc);

      if (issue.suggestion) {
        const suggestion = document.createElement('p');
        suggestion.className = 'muted';
        suggestion.textContent = 'Suggestion: ' + issue.suggestion;
        issueEl.appendChild(suggestion);
      }

      if (issue.code) {
        const code = document.createElement('pre');
        code.className = 'issue-code mono';
        code.textContent = issue.code;
        issueEl.appendChild(code);
      }
      block.appendChild(issueEl);
    });

    issuesEl.appendChild(block);
  });
}

async function runReview(event) {
  event.preventDefault();
  setStatus('Running review...', 'muted');
  resultsEl.classList.add('hidden');
  emptyStateEl.textContent = 'Running review...';
  emptyStateEl.classList.remove('hidden');

  const payload = {
    mode: fields.mode.value,
    repoPath: fields.repoPath.value.trim() || undefined,
    baseBranch: fields.baseBranch.value.trim() || undefined,
    sourceBranch: fields.sourceBranch.value.trim() || undefined,
    targetBranch: fields.targetBranch.value.trim() || undefined,
    files: fields.files.value.trim() || undefined,
    maxFiles: fields.maxFiles.value ? Number(fields.maxFiles.value) : undefined,
    severity: fields.severity.value,
    timeoutSeconds: fields.timeout.value ? Number(fields.timeout.value) : undefined,
    includeAllFiles: fields.includeAll.checked,
    configPath: fields.configPath.value.trim() || undefined,
    llm: {
      endpoint: fields.endpoint.value.trim() || undefined,
      model: fields.model.value.trim() || undefined,
    },
    network: {
      allowedHosts: fields.allowedHosts.value
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean),
    },
  };

  const res = await fetch('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    setStatus(data.error || 'Review failed.', 'error');
    emptyStateEl.textContent = 'Review failed. Fix the inputs and try again.';
    return;
  }

  setStatus('Review completed.', 'success');
  renderResults(data.result);

  state.history.push({
    title: data.result.metadata.sourceBranch + ' → ' + data.result.metadata.targetBranch,
    meta:
      new Date(data.result.metadata.timestamp).toLocaleString() +
      ' · ' +
      data.result.summary.totalIssues +
      ' issues',
  });
  renderHistory();
  setActiveNav('resultsPanel');
  scrollToPanel('resultsPanel');
}

byId('reviewForm').addEventListener('submit', runReview);
fields.mode.addEventListener('change', updateModeFields);
[
  fields.repoPath,
  fields.baseBranch,
  fields.sourceBranch,
  fields.targetBranch,
  fields.files,
  fields.maxFiles,
  fields.severity,
  fields.timeout,
].forEach((field) => field.addEventListener('input', updatePreview));
byId('refreshDefaults').addEventListener('click', loadDefaults);
byId('refreshModels').addEventListener('click', loadModels);
modelListEl.addEventListener('change', () => {
  if (modelListEl.value) {
    fields.model.value = modelListEl.value;
  }
});
browseButtonEl.addEventListener('click', openBrowser);
browserCloseEl.addEventListener('click', closeBrowser);
browserUpEl.addEventListener('click', () => {
  if (browserParentPath) {
    loadDirectory(browserParentPath);
  }
});
browserSelectEl.addEventListener('click', () => {
  if (browserCurrentPath) {
    fields.repoPath.value = browserCurrentPath;
    updatePreview();
  }
  closeBrowser();
});
useCwdButtonEl.addEventListener('click', () => {
  if (state.cwd) {
    fields.repoPath.value = state.cwd;
    updatePreview();
  }
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;
    if (target) {
      setActiveNav(target);
      scrollToPanel(target);
    }
  });
});

updateModeFields();
renderHistory();
loadDefaults();
`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PR Review CLI - Local UI</title>
  <style>${css}</style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <h1>PR Review CLI</h1>
        <span class="tag">Local UI · v${options.version}</span>
      </div>
      <div class="nav">
        <button class="active" data-target="inputsPanel">Run Review</button>
        <button data-target="resultsPanel">Results</button>
        <button data-target="historyPanel">History</button>
        <button data-target="settingsPanel">Settings</button>
      </div>
      <div class="version">Server: http://${options.host}:${options.port}</div>
    </aside>

    <main class="main">
      <div class="header">
        <div>
          <h2>Run a local code review</h2>
          <p>Offline by default. No code leaves this machine.</p>
        </div>
        <div class="status-card">
          <div class="status-row"><span>Status</span><strong id="statusText">Idle</strong></div>
          <div class="status-row"><span>Mode</span><strong>Local UI</strong></div>
        </div>
      </div>

      <div class="section-stack">
        <section class="panel" id="inputsPanel">
          <h3>Review Inputs</h3>
          <form id="reviewForm" class="form-grid">
            <div>
              <label>Repository Path</label>
              <div class="row-inline">
                <input id="repoPath" placeholder="/path/to/repo" />
                <button class="secondary mini" type="button" id="browseRepo">Browse</button>
              </div>
              <div class="helper">
                <button class="secondary mini" type="button" id="useCwd">Use current directory</button>
              </div>
            </div>

            <div class="row">
              <div>
                <label>Mode</label>
                <select id="mode">
                  <option value="base">Current vs base</option>
                  <option value="compare">Compare branches</option>
                </select>
              </div>
              <div data-mode="base">
                <label>Base Branch</label>
                <input id="baseBranch" value="main" />
              </div>
            </div>

            <div class="row" data-mode="compare">
              <div>
                <label>Source Branch</label>
                <input id="sourceBranch" placeholder="feature/my-branch" />
              </div>
              <div>
                <label>Target Branch</label>
                <input id="targetBranch" placeholder="main" />
              </div>
            </div>

            <div class="row">
              <div>
                <label>File Glob (optional)</label>
                <input id="files" placeholder="src/**/*.ts" />
              </div>
              <div>
                <label>Max Files</label>
                <input id="maxFiles" type="number" min="1" placeholder="50" />
              </div>
            </div>

            <div class="row">
              <div>
                <label>Severity Filter</label>
                <select id="severity">
                  <option value="all">All</option>
                  <option value="high">High+</option>
                  <option value="critical">Critical only</option>
                </select>
              </div>
              <div>
                <label>Timeout (seconds)</label>
                <input id="timeout" type="number" min="5" placeholder="60" />
              </div>
            </div>

            <div class="row">
              <div>
                <label>LLM Endpoint</label>
                <input id="endpoint" placeholder="http://localhost:11434" />
              </div>
              <div>
                <label>LLM Model</label>
                <input id="model" placeholder="deepseek-coder:6.7b" />
                <div class="row-inline" style="margin-top:8px;">
                  <select id="modelList">
                    <option value="">Select a model</option>
                  </select>
                  <button class="secondary mini" type="button" id="refreshModels">Load models</button>
                </div>
                <div class="muted" id="modelStatus"></div>
              </div>
            </div>

            <div class="row">
              <div>
                <label>Allowed Hosts</label>
                <input id="allowedHosts" placeholder="localhost,127.0.0.1,::1" />
              </div>
              <div>
                <label>Config File (optional)</label>
                <input id="configPath" placeholder="./pr-review.config.yml" />
              </div>
            </div>

            <label class="toggle">
              <input id="includeAll" type="checkbox" /> Include all files (skip max limit)
            </label>

            <div class="actions">
              <button class="primary" type="submit">Run Review</button>
              <button class="secondary" type="button" id="refreshDefaults">Reload Defaults</button>
            </div>

            <div class="preview mono" id="commandPreview"></div>
          </form>
        </section>

        <section class="panel" id="resultsPanel">
          <h3>Results</h3>
          <div id="results" class="hidden">
            <div class="summary" id="summary"></div>
            <div class="summary-box" id="changeSummary"></div>
            <div id="issues"></div>
          </div>
          <div class="muted" id="emptyState">Run a review to see results.</div>
        </section>

        <section class="panel" id="historyPanel">
          <h3>History</h3>
          <div id="historyList"></div>
        </section>

        <section class="panel" id="settingsPanel">
          <h3>Settings</h3>
          <div id="settingsList"></div>
        </section>
      </div>
    </main>
  </div>

  <div class="browser hidden" id="browser">
    <div class="browser-panel">
      <div class="browser-header">
        <div>
          <div class="muted">Select repository</div>
          <div class="mono browser-path" id="browserPath"></div>
        </div>
        <div class="row-inline">
          <button class="secondary mini" type="button" id="browserUp">Up</button>
          <button class="secondary mini" type="button" id="browserSelect">Select</button>
          <button class="secondary mini" type="button" id="browserClose">Close</button>
        </div>
      </div>
      <div class="browser-list" id="browserList"></div>
    </div>
  </div>

  <script>${js}</script>
</body>
</html>`;
}
