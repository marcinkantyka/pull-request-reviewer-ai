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
  --primary: #2da44e;
  --primary-strong: #2c974b;
  --critical: #cf222e;
  --high: #bc4c00;
  --medium: #bf8700;
  --low: #1a7f37;
  --info: #0969da;
  --shadow: 0 1px 0 rgba(27, 31, 36, 0.04);
  --radius-sm: 6px;
  --radius-md: 6px;
  --radius-lg: 8px;
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
  color: #fff;
  background: #2da44e;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(27, 31, 36, 0.15);
  box-shadow: 0 1px 0 rgba(27, 31, 36, 0.1);
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
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
}

.nav button.active {
  border-color: var(--border);
  background: #f6f8fa;
  color: var(--text);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--accent);
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
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
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
  padding: 16px 18px;
  min-width: 240px;
  box-shadow: var(--shadow);
  animation: floatIn 0.45s ease both;
}

.status-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
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
  border-radius: var(--radius-md);
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
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.24);
}

input:disabled, select:disabled, textarea:disabled {
  background: #f6f8fa;
  color: var(--muted);
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

.toggle.inline {
  margin: 0;
}

.toggle-field {
  display: grid;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.actions.sticky {
  position: sticky;
  bottom: 16px;
  z-index: 10;
  background: var(--surface);
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 24px rgba(27, 31, 36, 0.12);
}

button.primary {
  background: var(--primary);
  border: 1px solid rgba(27, 31, 36, 0.15);
  color: white;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 0 rgba(27, 31, 36, 0.1);
}

button.primary:hover:not(:disabled) {
  background: var(--primary-strong);
}

button.secondary {
  background: #f6f8fa;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

button.secondary:hover:not(:disabled) {
  background: #eef1f4;
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
  max-height: 240px;
  overflow: auto;
}

.summary-box {
  background: #f6f8fa;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.6;
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
  margin-bottom: 6px;
}

.summary-lines {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.summary-line {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 12px;
}

.summary-label {
  display: block;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.summary-items {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
}

.summary-inline {
  color: var(--muted);
  font-size: 13px;
}

.summary-body {
  display: grid;
  gap: 6px;
}

.section-divider {
  height: 1px;
  background: var(--border);
  margin: 12px 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.section-hint {
  color: var(--muted);
  font-size: 12px;
  margin-top: 4px;
}

.segmented {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #f6f8fa;
}

.segmented button {
  border: 0;
  background: transparent;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
}

.segmented button.active {
  background: #ffffff;
  color: var(--text);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.advanced-panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  background: #ffffff;
  display: grid;
  gap: 12px;
}

.advanced-body {
  display: grid;
  gap: 14px;
}

.textarea-tall {
  min-height: 120px;
}

.mini-select {
  min-width: 220px;
}

.provider-list {
  display: grid;
  gap: 10px;
}

.provider-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  background: #f6f8fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.provider-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.provider-name {
  font-weight: 600;
  font-size: 13px;
}

.provider-endpoint {
  font-size: 12px;
  color: var(--muted);
}

.provider-note {
  font-size: 11px;
  color: var(--muted);
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

.progress {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #ddf4ff;
  border: 1px solid #b6e3ff;
  border-left: 4px solid var(--accent);
  border-radius: var(--radius-md);
  color: var(--text);
  font-size: 13px;
  margin-bottom: 16px;
}

.progress strong {
  display: block;
  font-size: 13px;
}

.progress .muted {
  font-size: 12px;
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #b6d6f2;
  border-top-color: var(--accent);
  animation: spin 0.9s linear infinite;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--border);
  background: #f6f8fa;
  color: var(--muted);
}

.status-pill::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
}

.status-pill.running {
  background: #fff8c5;
  border-color: #d4a72c;
  color: #9a6700;
}

.status-pill.success {
  background: #dafbe1;
  border-color: #2da44e;
  color: #1a7f37;
}

.status-pill.error {
  background: #ffebe9;
  border-color: #cf222e;
  color: #a40e26;
}

.status-pill.running::before {
  background: #d4a72c;
  animation: pulse 1.2s ease-in-out infinite;
}

.status-pill.success::before {
  background: #2da44e;
}

.status-pill.error::before {
  background: #cf222e;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

.modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 80;
}

.modal-panel {
  width: min(560px, 90vw);
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  padding: 20px;
  display: grid;
  gap: 12px;
}

.modal-message {
  font-size: 14px;
  color: var(--text);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.modal-header h4 {
  margin: 0;
  font-size: 16px;
}

.modal-code {
  font-size: 12px;
  color: var(--muted);
  background: #f6f8fa;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 8px;
  width: fit-content;
}

.modal-details {
  background: #f6f8fa;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 12px;
  white-space: pre-wrap;
  max-height: 220px;
  overflow: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.warning-banner {
  background: #fff8c5;
  border: 1px solid #d4a72c;
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}

.warning-banner strong {
  color: #7a5a00;
}

.warning-banner ul {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
}

.warning-actions {
  display: flex;
  justify-content: flex-end;
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
  .summary-line {
    grid-template-columns: 1fr;
  }
  .actions.sticky {
    position: static;
    box-shadow: none;
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
  lastWarnings: [],
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
  provider: byId('provider'),
  model: byId('model'),
  temperature: byId('temperature'),
  topP: byId('topP'),
  seed: byId('seed'),
  maxTokens: byId('maxTokens'),
  apiKey: byId('apiKey'),
  retries: byId('retries'),
  retryDelay: byId('retryDelay'),
  allowedHosts: byId('allowedHosts'),
  includeAll: byId('includeAll'),
  configOutput: byId('configOutput'),
  excludePatterns: byId('excludePatterns'),
  severityLevels: byId('severityLevels'),
  categories: byId('categories'),
  projectContext: byId('projectContext'),
  changeSummaryMode: byId('changeSummaryMode'),
  contextAware: byId('contextAware'),
  groupByDirectory: byId('groupByDirectory'),
  groupByFeature: byId('groupByFeature'),
  maxLinesPerFile: byId('maxLinesPerFile'),
  maxGroupSize: byId('maxGroupSize'),
  directoryDepth: byId('directoryDepth'),
  concurrency: byId('concurrency'),
  outputFormat: byId('outputFormat'),
  outputColorize: byId('outputColorize'),
  outputShowDiff: byId('outputShowDiff'),
  diffContext: byId('diffContext'),
  maxDiffSize: byId('maxDiffSize'),
};

const statusEl = byId('statusText');
const progressBannerEl = byId('progressBanner');
const runButtonEl = byId('runReview');
const previewEl = byId('commandPreview');
const resultsEl = byId('results');
const summaryEl = byId('summary');
const changeSummaryEl = byId('changeSummary');
const issuesEl = byId('issues');
const emptyStateEl = byId('emptyState');
const warningsEl = byId('warnings');
const warningsListEl = byId('warningsList');
const warningsDetailsEl = byId('warningsDetails');
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
const togglePreviewEl = byId('togglePreview');
const generateConfigEl = byId('generateConfig');
const toggleConfigPreviewEl = byId('toggleConfigPreview');
const configPreviewEl = byId('configPreview');
const configStatusEl = byId('configStatus');
const providerListEl = byId('providerList');
const providerStatusEl = byId('providerStatus');
const advancedPanelEl = byId('advancedPanel');
const advancedButtons = document.querySelectorAll('[data-advanced]');
const errorModalEl = byId('errorModal');
const errorTitleEl = byId('errorTitle');
const errorCodeEl = byId('errorCode');
const errorMessageEl = byId('errorMessage');
const errorDetailsEl = byId('errorDetails');
const errorCloseEl = byId('errorClose');
let browserCurrentPath = '';
let browserParentPath = null;
let previewVisible = false;
let configTemplateCache = '';
let configPreviewVisible = false;
let detectedProviders = [];
let suppressModelInput = false;
let advancedEnabled = false;

const parseNumber = (value) => {
  if (value === undefined || value === null) return undefined;
  if (String(value).trim() === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const parseInteger = (value) => {
  if (value === undefined || value === null) return undefined;
  if (String(value).trim() === '') return undefined;
  const num = Number.parseInt(String(value), 10);
  return Number.isFinite(num) ? num : undefined;
};

const parseList = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseLines = (value) =>
  String(value || '')
    .split(/\\r?\\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

function setModelValue(value, message) {
  suppressModelInput = true;
  fields.model.value = value;
  if (message) {
    modelStatusEl.textContent = message;
  }
  setTimeout(() => {
    suppressModelInput = false;
  }, 0);
}

function showErrorDialog({ title, message, code, details }) {
  if (!errorModalEl) {
    return;
  }
  if (message || code || details) {
    console.error('UI error:', { title, message, code, details });
  }
  errorTitleEl.textContent = title || 'Something went wrong';
  errorMessageEl.textContent = message || 'Unexpected error.';
  if (code) {
    errorCodeEl.textContent = code;
    errorCodeEl.classList.remove('hidden');
  } else {
    errorCodeEl.textContent = '';
    errorCodeEl.classList.add('hidden');
  }
  if (details) {
    errorDetailsEl.textContent =
      typeof details === 'string' ? details : JSON.stringify(details, null, 2);
    errorDetailsEl.classList.remove('hidden');
  } else {
    errorDetailsEl.textContent = '';
    errorDetailsEl.classList.add('hidden');
  }
  errorModalEl.classList.remove('hidden');
}

function hideErrorDialog() {
  if (errorModalEl) {
    errorModalEl.classList.add('hidden');
  }
}

function setStatus(text, tone = 'idle') {
  statusEl.textContent = text;
  statusEl.className = 'status-pill ' + tone;
}

function setBusy(isBusy) {
  progressBannerEl.classList.toggle('hidden', !isBusy);
  document.body.classList.toggle('busy', isBusy);
  const controls = document.querySelectorAll(
    '#reviewForm input, #reviewForm select, #reviewForm textarea, #reviewForm button'
  );
  controls.forEach((el) => {
    el.disabled = isBusy;
  });
  runButtonEl.textContent = isBusy ? 'Running…' : 'Run Review';
  byId('reviewForm').setAttribute('aria-busy', isBusy ? 'true' : 'false');
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
  const raw = String(narrative || '').trim();
  let normalized = raw.replace(/\s+[–—-]\s+(?=[A-Z])/g, '\n- ');
  if (!normalized.includes('\n') && /(Top files by churn:|Top directories touched:|Largest change:)/i.test(raw)) {
    normalized = raw.replace(
      /\s+(Top files by churn:|Top directories touched:|Largest change:)/gi,
      '\n- $1'
    );
  }
  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    changeSummaryEl.textContent = 'No change summary available.';
    return;
  }

  const intro = document.createElement('p');
  intro.textContent = lines[0].replace(/^Change summary:\s*/i, 'Change summary: ');
  changeSummaryEl.appendChild(intro);

  if (lines.length > 1) {
    const list = document.createElement('div');
    list.className = 'summary-lines';
    lines.slice(1).forEach((line) => {
      const clean = line.replace(/^[-•]\s*/, '');
      const item = document.createElement('div');
      item.className = 'summary-line';

      const divider = clean.indexOf(':');
      if (divider > -1) {
        const label = document.createElement('span');
        label.className = 'summary-label';
        label.textContent = clean.slice(0, divider).trim();
        item.appendChild(label);

        const body = document.createElement('div');
        body.className = 'summary-body';
        const rest = clean.slice(divider + 1).trim();
        if (rest.includes(';')) {
          const subList = document.createElement('ul');
          subList.className = 'summary-items';
          rest
            .split(';')
            .map((entry) => entry.trim())
            .filter(Boolean)
            .forEach((entry) => {
              const li = document.createElement('li');
              li.textContent = entry;
              subList.appendChild(li);
            });
          body.appendChild(subList);
        } else {
          const inline = document.createElement('div');
          inline.className = 'summary-inline';
          inline.textContent = rest;
          body.appendChild(inline);
        }
        item.appendChild(body);
      } else {
        const text = document.createElement('div');
        text.className = 'summary-inline';
        text.textContent = clean;
        item.appendChild(text);
      }

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
    {
      label: 'Project context',
      value: state.defaults.review.projectContext || '—',
    },
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
  const provider = fields.provider.value || 'ollama';
  modelStatusEl.textContent = 'Loading models...';
  modelListEl.innerHTML = '<option value="">Pick from list</option>';
  if (provider === 'llamacpp' || provider === 'mock') {
    modelListEl.disabled = true;
    modelStatusEl.textContent =
      provider === 'llamacpp'
        ? 'Model list not available. Llama.cpp ignores model name; you can keep any value.'
        : 'Model list not available for this provider. Enter the model name manually.';
    return;
  }
  modelListEl.disabled = false;

  const endpoint = fields.endpoint.value.trim();
  const url = endpoint
    ? '/api/models?provider=' +
      encodeURIComponent(provider) +
      '&endpoint=' +
      encodeURIComponent(endpoint)
    : '/api/models?provider=' + encodeURIComponent(provider);
  let data;
  try {
    const res = await fetch(url);
    data = await res.json();
    if (!res.ok || !data.ok) {
      const message = data.error || 'Failed to load models.';
      modelStatusEl.textContent = message;
      showErrorDialog({
        title: 'Failed to load models',
        message,
        code: data.code,
        details: data.details,
      });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    modelStatusEl.textContent = message;
    showErrorDialog({ title: 'Failed to load models', message });
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

  const current = fields.model.value.trim();
  const defaultModel = state.defaults?.llm?.model || '';
  const hasCurrent = current && data.models.includes(current);
  const shouldAutoSelect = !current || current === defaultModel;
  if (shouldAutoSelect) {
    setModelValue(
      data.models[0],
      'Auto-selected "' + data.models[0] + '" from available models.'
    );
    modelListEl.value = data.models[0];
  } else if (!hasCurrent) {
    modelListEl.value = '';
    modelStatusEl.textContent = 'Manual model: "' + current + '".';
  } else {
    modelListEl.value = current;
    modelStatusEl.textContent = 'Models loaded. Select from the list or keep your value.';
  }
}

function applyProviderChoice(provider, isAuto = false) {
  if (!provider) return;
  fields.provider.value = provider.provider;
  fields.endpoint.value = provider.endpoint;

  if (Array.isArray(provider.models) && provider.models.length > 0) {
    setModelValue(provider.models[0], 'Selected "' + provider.models[0] + '" from the list.');
  } else if (!fields.model.value.trim()) {
    setModelValue(
      provider.provider === 'llamacpp' ? 'llama.cpp' : 'local-model',
      'Manual model: "' +
        (provider.provider === 'llamacpp' ? 'llama.cpp' : 'local-model') +
        '".'
    );
  }

  if (!isAuto) {
    providerStatusEl.textContent = 'Using ' + provider.name + ' at ' + provider.endpoint;
  }
  updatePreview();
  loadModels();
}

function renderProviders() {
  providerListEl.innerHTML = '';
  if (!detectedProviders.length) {
    providerStatusEl.textContent = 'No local LLM detected. Enter endpoint and model manually.';
    return;
  }
  providerStatusEl.textContent = 'Select a detected provider to prefill settings.';

  detectedProviders.forEach((provider) => {
    const card = document.createElement('div');
    card.className = 'provider-card';

    const meta = document.createElement('div');
    meta.className = 'provider-meta';
    const name = document.createElement('div');
    name.className = 'provider-name';
    name.textContent = provider.name;
    const endpoint = document.createElement('div');
    endpoint.className = 'provider-endpoint';
    endpoint.textContent = provider.endpoint;
    meta.appendChild(name);
    meta.appendChild(endpoint);
    if (provider.note) {
      const note = document.createElement('div');
      note.className = 'provider-note';
      note.textContent = provider.note;
      meta.appendChild(note);
    }

    const action = document.createElement('button');
    action.className = 'secondary mini';
    action.type = 'button';
    action.textContent = 'Use';
    action.addEventListener('click', () => applyProviderChoice(provider));

    card.appendChild(meta);
    card.appendChild(action);
    providerListEl.appendChild(card);
  });
}

async function detectProviders() {
  providerStatusEl.textContent = 'Scanning for local LLMs...';
  try {
    const res = await fetch('/api/providers');
    const data = await res.json();
    if (!res.ok || !data.ok) {
      showErrorDialog({
        title: 'Failed to detect local LLMs',
        message: data.error || 'Provider detection failed.',
        code: data.code,
        details: data.details,
      });
      detectedProviders = [];
      renderProviders();
      return;
    }
    detectedProviders = Array.isArray(data.providers) ? data.providers : [];
  } catch {
    detectedProviders = [];
    showErrorDialog({
      title: 'Failed to detect local LLMs',
      message: 'Unable to detect local LLM servers. Configure manually.',
    });
  }
  renderProviders();

  if (!detectedProviders.length) {
    return;
  }

  const defaults = state.defaults?.llm || {};
  const endpoint = fields.endpoint.value.trim();
  const model = fields.model.value.trim();
  const shouldAuto =
    !endpoint ||
    endpoint === (defaults.endpoint || '') ||
    !model ||
    model === (defaults.model || '');

  if (shouldAuto) {
    applyProviderChoice(detectedProviders[0], true);
  }
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
  let data;
  try {
    const res = await fetch('/api/defaults');
    data = await res.json();
    if (!res.ok || !data.ok) {
      const message = data.error || 'Failed to load defaults.';
      setStatus(message, 'error');
      showErrorDialog({
        title: 'Failed to load defaults',
        message,
        code: data.code,
        details: data.details,
      });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(message, 'error');
    showErrorDialog({ title: 'Failed to load defaults', message });
    return;
  }
  state.defaults = data.defaults;
  state.cwd = data.meta && data.meta.cwd ? data.meta.cwd : '';

  const { llm, network, review, output, git } = data.defaults;
  fields.endpoint.value = llm.endpoint || '';
  fields.model.value = llm.model || '';
  fields.provider.value = llm.provider || 'ollama';
  fields.temperature.value = llm.temperature ?? '';
  fields.topP.value = llm.topP ?? '';
  fields.seed.value = llm.seed ?? '';
  fields.maxTokens.value = llm.maxTokens ?? '';
  fields.apiKey.value = '';
  fields.retries.value = llm.retries ?? '';
  fields.retryDelay.value = llm.retryDelay ?? '';
  fields.allowedHosts.value = (network.allowedHosts || []).join(',');
  fields.maxFiles.value = String(review.maxFiles ?? '');
  fields.maxLinesPerFile.value = String(review.maxLinesPerFile ?? '');
  fields.excludePatterns.value = (review.excludePatterns || []).join('\\n');
  fields.severityLevels.value = (review.severityLevels || []).join(',');
  fields.categories.value = (review.categories || []).join(',');
  fields.projectContext.value = review.projectContext || '';
  fields.changeSummaryMode.value = review.changeSummaryMode || 'deterministic';
  fields.contextAware.checked = review.contextAware ?? true;
  fields.groupByDirectory.checked = review.groupByDirectory ?? true;
  fields.groupByFeature.checked = review.groupByFeature ?? true;
  fields.maxGroupSize.value = String(review.maxGroupSize ?? '');
  fields.directoryDepth.value = String(review.directoryDepth ?? '');
  fields.concurrency.value = String(review.concurrency ?? '');
  fields.outputFormat.value = output.defaultFormat || 'text';
  fields.outputColorize.checked = output.colorize ?? true;
  fields.outputShowDiff.checked = output.showDiff ?? false;
  fields.diffContext.value = String(git.diffContext ?? '');
  fields.maxDiffSize.value = String(git.maxDiffSize ?? '');
  fields.severity.value = 'all';
  fields.timeout.value = String(Math.round((llm.timeout || 60000) / 1000));
  fields.includeAll.checked = review.includeAllFiles ?? false;
  fields.mode.value = 'base';
  fields.configOutput.value = 'pr-review.config.yml';

  updateModeFields();
  updatePreview();
  renderSettings();
  loadModels();
}

function renderResults(result) {
  resultsEl.classList.remove('hidden');
  emptyStateEl.classList.add('hidden');

  const warnings = (result.metadata && result.metadata.warnings) || [];
  state.lastWarnings = warnings;
  if (warnings.length > 0) {
    warningsEl.classList.remove('hidden');
    warningsListEl.innerHTML = '';
    warnings.slice(0, 3).forEach((warning) => {
      const item = document.createElement('li');
      item.textContent =
        (warning.code ? '[' + warning.code + '] ' : '') +
        warning.message +
        (warning.filePath ? ' (' + warning.filePath + ')' : '');
      warningsListEl.appendChild(item);
    });
    if (warnings.length > 3) {
      const item = document.createElement('li');
      item.textContent = 'And ' + (warnings.length - 3) + ' more...';
      warningsListEl.appendChild(item);
    }
  } else {
    warningsEl.classList.add('hidden');
    warningsListEl.innerHTML = '';
  }

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
  closeBrowser();
  setBusy(true);
  setStatus('Running', 'running');
  resultsEl.classList.add('hidden');
  emptyStateEl.textContent = 'Running review...';
  emptyStateEl.classList.remove('hidden');

  const reviewOverrides = {
    maxFiles: parseInteger(fields.maxFiles.value),
    includeAllFiles: fields.includeAll.checked,
  };
  if (advancedEnabled) {
    reviewOverrides.maxLinesPerFile = parseInteger(fields.maxLinesPerFile.value);
    reviewOverrides.excludePatterns = parseLines(fields.excludePatterns.value);
    reviewOverrides.severityLevels = parseList(fields.severityLevels.value);
    reviewOverrides.categories = parseList(fields.categories.value);
    reviewOverrides.projectContext = fields.projectContext.value.trim() || undefined;
    reviewOverrides.changeSummaryMode = fields.changeSummaryMode.value || undefined;
    reviewOverrides.contextAware = fields.contextAware.checked;
    reviewOverrides.groupByDirectory = fields.groupByDirectory.checked;
    reviewOverrides.groupByFeature = fields.groupByFeature.checked;
    reviewOverrides.maxGroupSize = parseInteger(fields.maxGroupSize.value);
    reviewOverrides.directoryDepth = parseInteger(fields.directoryDepth.value);
    reviewOverrides.concurrency = parseInteger(fields.concurrency.value);
  }

  const llmOverrides = {
    endpoint: fields.endpoint.value.trim() || undefined,
    model: fields.model.value.trim() || undefined,
    provider: fields.provider.value || undefined,
  };
  if (advancedEnabled) {
    llmOverrides.temperature = parseNumber(fields.temperature.value);
    llmOverrides.topP = parseNumber(fields.topP.value);
    llmOverrides.seed = parseInteger(fields.seed.value);
    llmOverrides.maxTokens = parseInteger(fields.maxTokens.value);
    llmOverrides.apiKey = fields.apiKey.value.trim() || undefined;
    llmOverrides.retries = parseInteger(fields.retries.value);
    llmOverrides.retryDelay = parseInteger(fields.retryDelay.value);
  }

  const payload = {
    mode: fields.mode.value,
    repoPath: fields.repoPath.value.trim() || undefined,
    baseBranch: fields.baseBranch.value.trim() || undefined,
    sourceBranch: fields.sourceBranch.value.trim() || undefined,
    targetBranch: fields.targetBranch.value.trim() || undefined,
    files: fields.files.value.trim() || undefined,
    severity: fields.severity.value,
    timeoutSeconds: parseNumber(fields.timeout.value),
    llm: llmOverrides,
    network: {
      allowedHosts: fields.allowedHosts.value
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean),
    },
    review: reviewOverrides,
  };

  if (advancedEnabled) {
    payload.output = {
      defaultFormat: fields.outputFormat.value || undefined,
      colorize: fields.outputColorize.checked,
      showDiff: fields.outputShowDiff.checked,
    };
    payload.git = {
      diffContext: parseInteger(fields.diffContext.value),
      maxDiffSize: parseInteger(fields.maxDiffSize.value),
    };
  }

  try {
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      const message = data.error || 'Review failed.';
      setStatus(message, 'error');
      emptyStateEl.textContent = 'Review failed. Fix the inputs and try again.';
      showErrorDialog({
        title: 'Review failed',
        message,
        code: data.code,
        details: data.details,
      });
      return;
    }

    setStatus('Review completed', 'success');
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus('Review failed', 'error');
    emptyStateEl.textContent = 'Review failed. Fix the inputs and try again.';
    showErrorDialog({ title: 'Review failed', message });
  } finally {
    setBusy(false);
  }
}

function togglePreview() {
  previewVisible = !previewVisible;
  previewEl.classList.toggle('hidden', !previewVisible);
  togglePreviewEl.textContent = previewVisible ? 'Hide command preview' : 'Show command preview';
  if (previewVisible) {
    updatePreview();
  }
}

function setAdvancedMode(showAdvanced) {
  advancedEnabled = showAdvanced;
  if (advancedPanelEl) {
    advancedPanelEl.classList.toggle('hidden', !showAdvanced);
    const inputs = advancedPanelEl.querySelectorAll('input, select, textarea');
    inputs.forEach((el) => {
      el.disabled = !showAdvanced;
    });
  }
  advancedButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.advanced === String(showAdvanced));
  });
}

async function loadConfigTemplate() {
  if (configTemplateCache) {
    return configTemplateCache;
  }
  const res = await fetch('/api/config-template');
  const data = await res.json();
  if (!res.ok || !data.ok) {
    const error = new Error(data.error || 'Failed to load template.');
    error.code = data.code;
    error.details = data.details;
    throw error;
  }
  configTemplateCache = data.template || '';
  return configTemplateCache;
}

async function toggleConfigPreview() {
  configPreviewVisible = !configPreviewVisible;
  configPreviewEl.classList.toggle('hidden', !configPreviewVisible);
  toggleConfigPreviewEl.textContent = configPreviewVisible ? 'Hide template' : 'Show template';
  if (configPreviewVisible) {
    try {
      const template = await loadConfigTemplate();
      configPreviewEl.textContent = template || 'Template unavailable.';
    } catch (error) {
      configPreviewEl.textContent = 'Unable to load template.';
      configStatusEl.textContent = String(error instanceof Error ? error.message : error);
      configStatusEl.className = 'muted error';
      showErrorDialog({
        title: 'Failed to load config template',
        message: String(error instanceof Error ? error.message : error),
      });
    }
  }
}

async function generateConfig() {
  configStatusEl.className = 'muted';
  configStatusEl.textContent = 'Generating config template...';
  const payload = {
    repoPath: fields.repoPath.value.trim() || undefined,
    outputPath: fields.configOutput.value.trim() || undefined,
  };

  const res = await fetch('/api/config-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    configStatusEl.className = 'muted error';
    const message = data.error || 'Failed to generate config.';
    configStatusEl.textContent = message;
    showErrorDialog({
      title: 'Failed to generate config',
      message,
      code: data.code,
      details: data.details,
    });
    return;
  }

  configStatusEl.className = 'muted success';
  configStatusEl.textContent = 'Config template written to ' + data.path;
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
fields.provider.addEventListener('change', loadModels);
togglePreviewEl.addEventListener('click', togglePreview);
generateConfigEl.addEventListener('click', generateConfig);
toggleConfigPreviewEl.addEventListener('click', toggleConfigPreview);
modelListEl.addEventListener('change', () => {
  if (modelListEl.value) {
    fields.model.value = modelListEl.value;
    modelStatusEl.textContent = 'Selected "' + modelListEl.value + '" from the list.';
  }
});
if (warningsDetailsEl) {
  warningsDetailsEl.addEventListener('click', () => {
    showErrorDialog({
      title: 'Review warnings',
      message: 'Some files were not analyzed due to errors.',
      details: (state.lastWarnings || []),
    });
  });
}
advancedButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setAdvancedMode(button.dataset.advanced === 'true');
  });
});
if (errorCloseEl) {
  errorCloseEl.addEventListener('click', hideErrorDialog);
}
if (errorModalEl) {
  errorModalEl.addEventListener('click', (event) => {
    if (event.target === errorModalEl) {
      hideErrorDialog();
    }
  });
}
fields.model.addEventListener('input', () => {
  if (suppressModelInput) {
    return;
  }
  const value = fields.model.value.trim();
  if (!value) {
    modelStatusEl.textContent = 'Enter a model name or pick one from the list.';
    modelListEl.value = '';
    return;
  }
  if (modelListEl.value && modelListEl.value !== value) {
    modelListEl.value = '';
  }
  modelStatusEl.textContent = 'Manual model: "' + value + '".';
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
setAdvancedMode(false);

window.addEventListener('error', (event) => {
  showErrorDialog({
    title: 'UI error',
    message: event.message || 'Unexpected UI error.',
  });
});
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
  showErrorDialog({
    title: 'Unhandled error',
    message: reason || 'Unexpected error.',
  });
});
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
          <div class="status-row"><span>Status</span><span id="statusText" class="status-pill idle">Idle</span></div>
          <div class="status-row"><span>Mode</span><strong>Local UI</strong></div>
        </div>
      </div>

      <div class="progress hidden" id="progressBanner">
        <div class="spinner"></div>
        <div>
          <strong>Review in progress</strong>
          <div class="muted">Inputs are locked to keep the run consistent. Large diffs can take a minute.</div>
        </div>
      </div>

      <div class="section-stack">
        <section class="panel" id="inputsPanel">
          <h3>Review Inputs</h3>
          <form id="reviewForm" class="form-grid" novalidate>
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

            <div>
              <div class="section-title">Detected local LLMs</div>
              <div class="section-hint">
                Pick a running local server to prefill provider, endpoint, and model.
              </div>
              <div class="provider-list" id="providerList"></div>
              <div class="muted" id="providerStatus"></div>
            </div>

            <div class="row">
              <div>
                <label>LLM Endpoint</label>
                <input id="endpoint" placeholder="http://localhost:11434" />
              </div>
              <div>
                <label>LLM Model (manual)</label>
                <input id="model" placeholder="deepseek-coder:6.7b" />
                <div class="muted">Provide the model name manually for your provider.</div>
                <div class="row-inline" style="margin-top:8px;">
                  <select id="modelList" class="mini-select">
                    <option value="">Pick from detected list</option>
                  </select>
                  <button class="secondary mini" type="button" id="refreshModels">Load models</button>
                </div>
                <div class="muted">Or choose from the detected list above.</div>
                <div class="muted">Manual input overrides list selection.</div>
                <div class="muted" id="modelStatus"></div>
              </div>
            </div>

            <div class="row">
              <div>
                <label>Allowed Hosts</label>
                <input id="allowedHosts" placeholder="localhost,127.0.0.1,::1" />
              </div>
              <div>
                <label>Config Template</label>
                <div class="row-inline">
                  <input id="configOutput" placeholder="pr-review.config.yml" />
                  <button class="secondary mini" type="button" id="generateConfig">Generate</button>
                </div>
                <div class="helper">
                  <button class="secondary mini" type="button" id="toggleConfigPreview">
                    Show template
                  </button>
                </div>
                <pre class="preview mono hidden" id="configPreview"></pre>
                <div class="muted" id="configStatus"></div>
              </div>
            </div>

            <label class="toggle">
              <input id="includeAll" type="checkbox" /> Include all files (skip max limit)
            </label>

            <div>
              <div class="section-title">Configuration level</div>
              <div class="section-hint">Use Basic for quick runs, Advanced to override all settings.</div>
              <div class="segmented" role="tablist" aria-label="Configuration level">
                <button type="button" class="active" data-advanced="false">Basic</button>
                <button type="button" data-advanced="true">Advanced</button>
              </div>
            </div>

            <div class="advanced-panel hidden" id="advancedPanel">
              <div>
                <div class="section-title">Advanced configuration</div>
                <div class="section-hint">Override any config option for this run.</div>
              </div>
              <div class="advanced-body">

            <div class="row">
              <div>
                <label>LLM Provider</label>
                <select id="provider">
                  <option value="ollama">ollama</option>
                  <option value="vllm">vllm (OpenAI-compatible)</option>
                  <option value="llamacpp">llama.cpp</option>
                  <option value="openai-compatible">LM Studio (OpenAI-compatible)</option>
                  <option value="mock">mock</option>
                </select>
              </div>
              <div>
                <label>Temperature</label>
                <input id="temperature" type="number" step="0.1" min="0" max="2" placeholder="0" />
              </div>
            </div>

            <div class="row">
              <div>
                <label>Top P</label>
                <input id="topP" type="number" step="0.05" min="0" max="1" placeholder="1.0" />
              </div>
              <div>
                <label>Max Tokens</label>
                <input id="maxTokens" type="number" min="1" placeholder="2048" />
              </div>
            </div>

            <div class="row">
              <div>
                <label>Seed</label>
                <input id="seed" type="number" min="0" step="1" placeholder="42" />
              </div>
              <div>
                <label>Retries</label>
                <input id="retries" type="number" min="0" max="10" step="1" placeholder="3" />
              </div>
            </div>

            <div class="row">
              <div>
                <label>Retry Delay (ms)</label>
                <input id="retryDelay" type="number" min="0" step="100" placeholder="1000" />
              </div>
            </div>

            <div>
              <label>API Key (optional)</label>
              <input id="apiKey" type="password" placeholder="sk-..." />
            </div>

            <div class="row">
              <div>
                <label>Output Format</label>
                <select id="outputFormat">
                  <option value="text">text</option>
                  <option value="json">json</option>
                  <option value="md">md</option>
                </select>
              </div>
              <div class="toggle-field">
                <div class="field-label">Colorize output</div>
                <label class="toggle inline">
                  <input id="outputColorize" type="checkbox" /> Enabled
                </label>
              </div>
            </div>

            <label class="toggle">
              <input id="outputShowDiff" type="checkbox" /> Include diff in output
            </label>

            <div class="row">
              <div>
                <label>Diff Context</label>
                <input id="diffContext" type="number" min="0" max="10" step="1" placeholder="3" />
              </div>
              <div>
                <label>Max Diff Size (bytes)</label>
                <input id="maxDiffSize" type="number" min="1" step="1024" placeholder="10485760" />
              </div>
            </div>

            <div>
              <label>Exclude Patterns (one per line)</label>
              <textarea id="excludePatterns" class="textarea-tall" placeholder="node_modules/**"></textarea>
            </div>

            <div class="row">
              <div>
                <label>Severity Levels (comma separated)</label>
                <input id="severityLevels" placeholder="critical,high,medium,low,info" />
              </div>
              <div>
                <label>Categories (comma separated)</label>
                <input id="categories" placeholder="security,bugs,performance,maintainability,style,bestPractices" />
              </div>
            </div>

            <div>
              <label>Project Context (optional)</label>
              <textarea id="projectContext" class="textarea-tall" placeholder="Describe domain rules, architecture constraints, or review focus areas."></textarea>
              <div class="muted">
                Added to the review prompt to reduce false positives. Example: "Do not flag exposed ports; service is private behind an ALB."
              </div>
            </div>

            <div class="row">
              <div>
                <label>Change Summary Mode</label>
                <select id="changeSummaryMode">
                  <option value="deterministic">deterministic</option>
                  <option value="llm">llm</option>
                </select>
              </div>
              <div class="toggle-field">
                <div class="field-label">Context-aware review</div>
                <label class="toggle inline">
                  <input id="contextAware" type="checkbox" /> Enabled
                </label>
              </div>
            </div>

            <div class="row">
              <div class="toggle-field">
                <div class="field-label">Group by directory</div>
                <label class="toggle inline">
                  <input id="groupByDirectory" type="checkbox" /> Enabled
                </label>
              </div>
              <div class="toggle-field">
                <div class="field-label">Group by feature</div>
                <label class="toggle inline">
                  <input id="groupByFeature" type="checkbox" /> Enabled
                </label>
              </div>
            </div>

            <div class="row">
              <div>
                <label>Max Lines Per File</label>
                <input id="maxLinesPerFile" type="number" min="1" step="10" placeholder="1000" />
              </div>
              <div>
                <label>Concurrency</label>
                <input id="concurrency" type="number" min="1" max="10" step="1" placeholder="3" />
              </div>
            </div>

              <div class="row">
                <div>
                  <label>Max Group Size</label>
                  <input id="maxGroupSize" type="number" min="1" max="10" step="1" placeholder="5" />
                </div>
                <div>
                  <label>Directory Depth</label>
                  <input id="directoryDepth" type="number" min="1" max="5" step="1" placeholder="2" />
                </div>
              </div>

              </div>
            </div>

            <div class="actions sticky">
              <button class="primary" type="submit" id="runReview">Run Review</button>
              <button class="secondary" type="button" id="refreshDefaults">Reload Defaults</button>
            </div>

            <div class="helper">
              <button class="secondary mini" type="button" id="togglePreview">
                Show command preview
              </button>
            </div>
            <div class="preview mono hidden" id="commandPreview"></div>
          </form>
        </section>

        <section class="panel" id="resultsPanel">
          <h3>Results</h3>
          <div id="results" class="hidden">
            <div class="warning-banner hidden" id="warnings">
              <strong>Review completed with warnings</strong>
              <ul id="warningsList"></ul>
              <div class="warning-actions">
                <button class="secondary mini" type="button" id="warningsDetails">
                  View details
                </button>
              </div>
            </div>
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

  <div class="modal hidden" id="errorModal">
    <div class="modal-panel" role="alertdialog" aria-modal="true">
      <div class="modal-header">
        <h4 id="errorTitle">Something went wrong</h4>
        <span class="modal-code hidden" id="errorCode"></span>
      </div>
      <div class="modal-message" id="errorMessage"></div>
      <pre class="modal-details hidden" id="errorDetails"></pre>
      <div class="modal-actions">
        <button class="secondary" type="button" id="errorClose">Close</button>
      </div>
    </div>
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
