import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { minimatch } from 'minimatch';
import path from 'node:path';
import fs from 'node:fs/promises';
import { DEFAULT_CONFIG, loadConfig } from '../core/storage/config.js';
import { GitRepositoryManager } from '../core/git/repo.js';
import { ReviewEngine } from '../core/review/engine.js';
import { logger } from '../utils/logger.js';
import { validateBranchName } from '../utils/validator.js';
import { validateConfig } from '../utils/validator.js';
import { PRReviewError } from '../utils/errors.js';
import type { AppConfig } from '../types/config.js';
import type { ReviewResult } from '../types/review.js';
import { renderUI } from './ui.js';
import { createSecureFetch } from '../utils/network-validator.js';

interface ServerOptions {
  host: string;
  port: number;
  version: string;
}

export interface UiServerHandle {
  host: string;
  port: number;
  close: () => Promise<void>;
}

interface ReviewRequest {
  mode?: 'compare' | 'base';
  repoPath?: string;
  sourceBranch?: string;
  targetBranch?: string;
  baseBranch?: string;
  files?: string;
  maxFiles?: number;
  timeoutSeconds?: number;
  severity?: 'all' | 'high' | 'critical';
  includeAllFiles?: boolean;
  configPath?: string;
  llm?: {
    endpoint?: string;
    model?: string;
    provider?: AppConfig['llm']['provider'];
    temperature?: number;
    topP?: number;
    seed?: number;
    maxTokens?: number;
    apiKey?: string;
    retries?: number;
    retryDelay?: number;
  };
  network?: {
    allowedHosts?: string[];
  };
  review?: {
    maxFiles?: number;
    maxLinesPerFile?: number;
    excludePatterns?: string[];
    severityLevels?: AppConfig['review']['severityLevels'];
    categories?: AppConfig['review']['categories'];
    projectContext?: string;
    includeAllFiles?: boolean;
    changeSummaryMode?: AppConfig['review']['changeSummaryMode'];
    contextAware?: boolean;
    groupByDirectory?: boolean;
    groupByFeature?: boolean;
    maxGroupSize?: number;
    directoryDepth?: number;
    concurrency?: number;
  };
  output?: {
    defaultFormat?: AppConfig['output']['defaultFormat'];
    colorize?: boolean;
    showDiff?: boolean;
  };
  git?: {
    diffContext?: number;
    maxDiffSize?: number;
  };
}

interface ConfigTemplateRequest {
  repoPath?: string;
  outputPath?: string;
}

interface ProviderInfo {
  name: string;
  provider: AppConfig['llm']['provider'];
  endpoint: string;
  models?: string[];
  note?: string;
}

const BODY_LIMIT = 1_000_000;
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1']);

function isLoopbackAddress(address?: string): boolean {
  if (!address) {
    return false;
  }
  if (LOOPBACK_ADDRESSES.has(address)) {
    return true;
  }
  return address.startsWith('::ffff:127.0.0.1');
}

function formatError(error: unknown): { message: string; code?: string; details?: unknown } {
  if (error instanceof PRReviewError) {
    return { message: error.message, code: error.code, details: error.details };
  }
  if (error instanceof Error) {
    return { message: error.message, code: 'UNKNOWN_ERROR' };
  }
  return { message: String(error), code: 'UNKNOWN_ERROR' };
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body).toString(),
  });
  res.end(body);
}

async function readJsonBody(req: IncomingMessage): Promise<ReviewRequest> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > BODY_LIMIT) {
      throw new Error('Payload too large');
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? (JSON.parse(raw) as ReviewRequest) : {};
}

type SanitizedConfig = Omit<AppConfig, 'llm'> & {
  llm: Omit<AppConfig['llm'], 'apiKey'>;
};

function sanitizeConfig(config: AppConfig): SanitizedConfig {
  const { llm, network, review, output, git, server } = config;
  return {
    llm: {
      endpoint: llm.endpoint,
      provider: llm.provider,
      model: llm.model,
      temperature: llm.temperature,
      topP: llm.topP,
      timeout: llm.timeout,
      maxTokens: llm.maxTokens,
      seed: llm.seed,
      retries: llm.retries,
      retryDelay: llm.retryDelay,
    },
    network: {
      allowedHosts: network.allowedHosts,
    },
    review: {
      maxFiles: review.maxFiles,
      includeAllFiles: review.includeAllFiles,
      maxLinesPerFile: review.maxLinesPerFile,
      excludePatterns: review.excludePatterns,
      severityLevels: review.severityLevels,
      categories: review.categories,
      projectContext: review.projectContext,
      changeSummaryMode: review.changeSummaryMode,
      contextAware: review.contextAware,
      groupByDirectory: review.groupByDirectory,
      groupByFeature: review.groupByFeature,
      maxGroupSize: review.maxGroupSize,
      directoryDepth: review.directoryDepth,
      concurrency: review.concurrency,
    },
    output: {
      defaultFormat: output.defaultFormat,
      colorize: output.colorize,
      showDiff: output.showDiff,
    },
    git: {
      diffContext: git.diffContext,
      maxDiffSize: git.maxDiffSize,
    },
    server: {
      host: server?.host,
      port: server?.port,
    },
  };
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function renderYamlList(items: string[], indent: string): string[] {
  return items.map((item) => `${indent}- ${yamlString(item)}`);
}

function buildConfigTemplate(config: AppConfig): string {
  const llm = config.llm;
  const review = config.review;
  const output = config.output;
  const git = config.git;
  const network = config.network;
  const server = config.server || DEFAULT_CONFIG.server;

  const lines = [
    '# PR Review CLI configuration',
    '# Save as pr-review.config.yml in your repository root.',
    '',
    'llm:',
    `  endpoint: ${yamlString(llm.endpoint)}`,
    `  provider: ${yamlString(llm.provider)}`,
    `  model: ${yamlString(llm.model)}`,
    `  temperature: ${llm.temperature}`,
    `  topP: ${llm.topP ?? 1}`,
    `  timeout: ${llm.timeout}`,
    `  maxTokens: ${llm.maxTokens ?? 2048}`,
    `  apiKey: ${llm.apiKey ? yamlString(llm.apiKey) : '""'}`,
    `  seed: ${llm.seed ?? 0}`,
    `  retries: ${llm.retries ?? 3}`,
    `  retryDelay: ${llm.retryDelay ?? 1000}`,
    '',
    'network:',
    '  allowedHosts:',
    ...renderYamlList(network.allowedHosts || [], '    '),
    '',
    'review:',
    `  maxFiles: ${review.maxFiles}`,
    `  maxLinesPerFile: ${review.maxLinesPerFile}`,
    '  excludePatterns:',
    ...renderYamlList(review.excludePatterns || [], '    '),
    '  severityLevels:',
    ...renderYamlList(review.severityLevels || [], '    '),
    '  categories:',
    ...renderYamlList(review.categories || [], '    '),
    `  projectContext: ${yamlString(review.projectContext ?? '')}`,
    `  includeAllFiles: ${review.includeAllFiles ?? false}`,
    `  changeSummaryMode: ${review.changeSummaryMode ?? 'deterministic'}`,
    `  contextAware: ${review.contextAware ?? true}`,
    `  groupByDirectory: ${review.groupByDirectory ?? true}`,
    `  groupByFeature: ${review.groupByFeature ?? true}`,
    `  maxGroupSize: ${review.maxGroupSize ?? 5}`,
    `  directoryDepth: ${review.directoryDepth ?? 2}`,
    `  concurrency: ${review.concurrency ?? 3}`,
    '',
    'output:',
    `  defaultFormat: ${output.defaultFormat}`,
    `  colorize: ${output.colorize}`,
    `  showDiff: ${output.showDiff}`,
    '',
    'git:',
    `  diffContext: ${git.diffContext}`,
    `  maxDiffSize: ${git.maxDiffSize}`,
    '',
    'server:',
    `  host: ${yamlString(server?.host ?? '127.0.0.1')}`,
    `  port: ${server?.port ?? 47831}`,
    '',
  ];

  return lines.join('\n');
}

function isPathWithin(basePath: string, targetPath: string): boolean {
  const relative = path.relative(basePath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function fetchWithTimeout(
  fetchFn: typeof fetch,
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchFn(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function extractOllamaModels(data: { models?: Array<{ name?: string }> }): string[] {
  return (data.models || [])
    .map((model) => model.name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));
}

function extractOpenAIModels(data: { data?: Array<{ id?: string }> }): string[] {
  return (data.data || [])
    .map((model) => model.id)
    .filter((id): id is string => Boolean(id))
    .sort((a, b) => a.localeCompare(b));
}

async function detectProviders(allowedHosts: string[]): Promise<ProviderInfo[]> {
  const secureFetch = createSecureFetch(allowedHosts);
  const timeoutMs = 1200;
  const providers: ProviderInfo[] = [];

  const candidates: Array<{
    name: string;
    provider: ProviderInfo['provider'];
    endpoint: string;
    type: 'ollama' | 'openai' | 'llamacpp';
  }> = [
    { name: 'Ollama', provider: 'ollama', endpoint: 'http://localhost:11434', type: 'ollama' },
    {
      name: 'LM Studio',
      provider: 'openai-compatible',
      endpoint: 'http://localhost:1234',
      type: 'openai',
    },
    {
      name: 'vLLM',
      provider: 'vllm',
      endpoint: 'http://localhost:8000',
      type: 'openai',
    },
    {
      name: 'Text Generation WebUI',
      provider: 'openai-compatible',
      endpoint: 'http://localhost:5000',
      type: 'openai',
    },
    {
      name: 'KoboldCpp',
      provider: 'openai-compatible',
      endpoint: 'http://localhost:5001',
      type: 'openai',
    },
    {
      name: 'LocalAI / TGI',
      provider: 'openai-compatible',
      endpoint: 'http://localhost:8080',
      type: 'openai',
    },
    {
      name: 'llama.cpp',
      provider: 'llamacpp',
      endpoint: 'http://localhost:8080',
      type: 'llamacpp',
    },
  ];

  const seenEndpoints = new Set<string>();
  for (const candidate of candidates) {
    if (seenEndpoints.has(candidate.endpoint)) {
      continue;
    }
    try {
      if (candidate.type === 'ollama') {
        const res = await fetchWithTimeout(
          secureFetch,
          new URL('/api/tags', candidate.endpoint).toString(),
          { method: 'GET' },
          timeoutMs
        );
        if (!res.ok) continue;
        const data = (await res.json()) as { models?: Array<{ name?: string }> };
        providers.push({
          name: candidate.name,
          provider: candidate.provider,
          endpoint: candidate.endpoint,
          models: extractOllamaModels(data),
        });
        seenEndpoints.add(candidate.endpoint);
        continue;
      }

      if (candidate.type === 'openai') {
        const res = await fetchWithTimeout(
          secureFetch,
          new URL('/v1/models', candidate.endpoint).toString(),
          { method: 'GET' },
          timeoutMs
        );
        if (!res.ok) continue;
        const data = (await res.json()) as { data?: Array<{ id?: string }> };
        providers.push({
          name: candidate.name,
          provider: candidate.provider,
          endpoint: candidate.endpoint,
          models: extractOpenAIModels(data),
        });
        seenEndpoints.add(candidate.endpoint);
        continue;
      }

      if (candidate.type === 'llamacpp') {
        const res = await fetchWithTimeout(
          secureFetch,
          new URL('/health', candidate.endpoint).toString(),
          { method: 'GET' },
          timeoutMs
        );
        if (!res.ok) continue;
        providers.push({
          name: candidate.name,
          provider: candidate.provider,
          endpoint: candidate.endpoint,
          note: 'Model name is ignored by llama.cpp.',
        });
        seenEndpoints.add(candidate.endpoint);
      }
    } catch {
      // Ignore detection failures
    }
  }

  return providers;
}

function applyRequestOverrides(config: AppConfig, payload: ReviewRequest): AppConfig {
  if (payload.timeoutSeconds) {
    config.llm.timeout = payload.timeoutSeconds * 1000;
  }
  if (payload.maxFiles) {
    config.review.maxFiles = payload.maxFiles;
  }
  if (payload.includeAllFiles !== undefined) {
    config.review.includeAllFiles = payload.includeAllFiles;
  }
  if (payload.llm?.endpoint) {
    config.llm.endpoint = payload.llm.endpoint;
  }
  if (payload.llm?.model) {
    config.llm.model = payload.llm.model;
  }
  if (payload.llm?.provider) {
    config.llm.provider = payload.llm.provider;
  }
  if (payload.llm?.temperature !== undefined) {
    config.llm.temperature = payload.llm.temperature;
  }
  if (payload.llm?.topP !== undefined) {
    config.llm.topP = payload.llm.topP;
  }
  if (payload.llm?.seed !== undefined) {
    config.llm.seed = payload.llm.seed;
  }
  if (payload.llm?.maxTokens !== undefined) {
    config.llm.maxTokens = payload.llm.maxTokens;
  }
  if (payload.llm?.apiKey) {
    config.llm.apiKey = payload.llm.apiKey;
  }
  if (payload.llm?.retries !== undefined) {
    config.llm.retries = payload.llm.retries;
  }
  if (payload.llm?.retryDelay !== undefined) {
    config.llm.retryDelay = payload.llm.retryDelay;
  }
  if (payload.network?.allowedHosts && payload.network.allowedHosts.length > 0) {
    config.network.allowedHosts = payload.network.allowedHosts;
  }
  if (payload.review) {
    if (payload.review.maxFiles !== undefined) {
      config.review.maxFiles = payload.review.maxFiles;
    }
    if (payload.review.maxLinesPerFile !== undefined) {
      config.review.maxLinesPerFile = payload.review.maxLinesPerFile;
    }
    if (payload.review.excludePatterns) {
      config.review.excludePatterns = payload.review.excludePatterns;
    }
    if (payload.review.severityLevels) {
      config.review.severityLevels = payload.review.severityLevels;
    }
    if (payload.review.categories) {
      config.review.categories = payload.review.categories;
    }
    if (payload.review.projectContext !== undefined) {
      config.review.projectContext = payload.review.projectContext;
    }
    if (payload.review.includeAllFiles !== undefined) {
      config.review.includeAllFiles = payload.review.includeAllFiles;
    }
    if (payload.review.changeSummaryMode) {
      config.review.changeSummaryMode = payload.review.changeSummaryMode;
    }
    if (payload.review.contextAware !== undefined) {
      config.review.contextAware = payload.review.contextAware;
    }
    if (payload.review.groupByDirectory !== undefined) {
      config.review.groupByDirectory = payload.review.groupByDirectory;
    }
    if (payload.review.groupByFeature !== undefined) {
      config.review.groupByFeature = payload.review.groupByFeature;
    }
    if (payload.review.maxGroupSize !== undefined) {
      config.review.maxGroupSize = payload.review.maxGroupSize;
    }
    if (payload.review.directoryDepth !== undefined) {
      config.review.directoryDepth = payload.review.directoryDepth;
    }
    if (payload.review.concurrency !== undefined) {
      config.review.concurrency = payload.review.concurrency;
    }
  }
  if (payload.output) {
    if (payload.output.defaultFormat) {
      config.output.defaultFormat = payload.output.defaultFormat;
    }
    if (payload.output.colorize !== undefined) {
      config.output.colorize = payload.output.colorize;
    }
    if (payload.output.showDiff !== undefined) {
      config.output.showDiff = payload.output.showDiff;
    }
  }
  if (payload.git) {
    if (payload.git.diffContext !== undefined) {
      config.git.diffContext = payload.git.diffContext;
    }
    if (payload.git.maxDiffSize !== undefined) {
      config.git.maxDiffSize = payload.git.maxDiffSize;
    }
  }

  return config;
}

function applySeverityFilter(result: ReviewResult, severity: ReviewRequest['severity']): void {
  if (!severity || severity === 'all') {
    return;
  }

  const minSeverity = severity === 'critical' ? 'critical' : 'high';
  const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
  const minIndex = severityOrder.indexOf(minSeverity);

  result.files = result.files.map((file) => ({
    ...file,
    issues: file.issues.filter((issue) => severityOrder.indexOf(issue.severity) <= minIndex),
  }));

  const allIssues = result.files.flatMap((file) => file.issues);
  result.summary = {
    ...result.summary,
    totalIssues: allIssues.length,
    critical: allIssues.filter((issue) => issue.severity === 'critical').length,
    high: allIssues.filter((issue) => issue.severity === 'high').length,
    medium: allIssues.filter((issue) => issue.severity === 'medium').length,
    low: allIssues.filter((issue) => issue.severity === 'low').length,
    info: allIssues.filter((issue) => issue.severity === 'info').length,
  };
}

async function listDirectories(targetPath?: string): Promise<{
  path: string;
  parent: string | null;
  entries: Array<{ name: string; path: string }>;
}> {
  const resolved = path.resolve(targetPath || process.cwd());
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const stats = await fs.stat(resolved);
  if (!stats.isDirectory()) {
    throw new Error('Path is not a directory');
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(resolved, entry.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const parent = path.dirname(resolved);
  const root = path.parse(resolved).root;
  return {
    path: resolved,
    parent: resolved === root ? null : parent,
    entries: directories,
  };
}

export async function startServer(options: ServerOptions): Promise<UiServerHandle> {
  let uiHtml = '';

  const handleRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (!isLoopbackAddress(req.socket.remoteAddress)) {
      sendJson(res, 403, { ok: false, error: 'Forbidden' });
      return;
    }
    const url = new URL(req.url || '/', `http://${options.host}`);

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(uiHtml);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/defaults') {
      try {
        const config = await loadConfig();
        sendJson(res, 200, {
          ok: true,
          defaults: sanitizeConfig(config),
          meta: { cwd: process.cwd() },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to load defaults');
        const formatted = formatError(error);
        sendJson(res, 500, {
          ok: false,
          error: formatted.message,
          code: formatted.code,
          details: formatted.details,
        });
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/fs') {
      try {
        const targetPath = url.searchParams.get('path') || undefined;
        const listing = await listDirectories(targetPath);
        sendJson(res, 200, { ok: true, ...listing });
      } catch (error) {
        logger.error({ error }, 'Failed to list directories');
        const formatted = formatError(error);
        sendJson(res, 400, {
          ok: false,
          error: formatted.message,
          code: formatted.code,
          details: formatted.details,
        });
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/providers') {
      try {
        const config = await loadConfig();
        const providers = await detectProviders(config.network.allowedHosts);
        sendJson(res, 200, { ok: true, providers });
      } catch (error) {
        logger.error({ error }, 'Failed to detect providers');
        const formatted = formatError(error);
        sendJson(res, 500, {
          ok: false,
          error: formatted.message,
          code: formatted.code,
          details: formatted.details,
        });
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/models') {
      try {
        const config = await loadConfig();
        const provider =
          (url.searchParams.get('provider') as AppConfig['llm']['provider']) || config.llm.provider;
        const endpoint = url.searchParams.get('endpoint') || config.llm.endpoint;
        const secureFetch = createSecureFetch(config.network.allowedHosts);

        if (provider === 'ollama') {
          const tagsUrl = new URL('/api/tags', endpoint).toString();
          const response = await secureFetch(tagsUrl);
          if (!response.ok) {
            sendJson(res, 200, { ok: true, supported: true, models: [] });
            return;
          }
          const data = (await response.json()) as { models?: Array<{ name?: string }> };
          sendJson(res, 200, { ok: true, supported: true, models: extractOllamaModels(data) });
          return;
        }

        if (provider === 'openai-compatible' || provider === 'vllm') {
          const modelsUrl = new URL('/v1/models', endpoint).toString();
          const response = await secureFetch(modelsUrl);
          if (!response.ok) {
            sendJson(res, 200, { ok: true, supported: true, models: [] });
            return;
          }
          const data = (await response.json()) as { data?: Array<{ id?: string }> };
          sendJson(res, 200, { ok: true, supported: true, models: extractOpenAIModels(data) });
          return;
        }

        sendJson(res, 200, { ok: true, supported: false, models: [] });
      } catch (error) {
        logger.error({ error }, 'Failed to load models');
        const formatted = formatError(error);
        sendJson(res, 500, {
          ok: false,
          error: formatted.message,
          code: formatted.code,
          details: formatted.details,
        });
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/config-template') {
      try {
        const config = await loadConfig();
        const template = buildConfigTemplate(config);
        sendJson(res, 200, { ok: true, template });
      } catch (error) {
        logger.error({ error }, 'Failed to load config template');
        const formatted = formatError(error);
        sendJson(res, 500, {
          ok: false,
          error: formatted.message,
          code: formatted.code,
          details: formatted.details,
        });
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/config-template') {
      try {
        const payload = (await readJsonBody(req)) as ConfigTemplateRequest;
        const config = await loadConfig();
        const template = buildConfigTemplate(config);
        const basePath = payload.repoPath ? path.resolve(payload.repoPath) : process.cwd();
        const outputPath = payload.outputPath?.trim() || 'pr-review.config.yml';
        const resolvedPath = path.isAbsolute(outputPath)
          ? outputPath
          : path.join(basePath, outputPath);
        const ext = path.extname(resolvedPath).toLowerCase();
        if (!['.yml', '.yaml'].includes(ext)) {
          throw new PRReviewError(
            'Config template must use a .yml or .yaml extension.',
            'VALIDATION_ERROR'
          );
        }
        if (!isPathWithin(basePath, resolvedPath)) {
          throw new PRReviewError(
            'Config template must be created inside the selected repository.',
            'VALIDATION_ERROR'
          );
        }

        // eslint-disable-next-line security/detect-non-literal-fs-filename
        await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        await fs.writeFile(resolvedPath, template, { flag: 'wx' });
        sendJson(res, 200, { ok: true, path: resolvedPath });
      } catch (error) {
        logger.error({ error }, 'Failed to generate config template');
        const formatted = formatError(error);
        const message =
          error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST'
            ? 'Config template already exists. Choose a different name or delete the existing file.'
            : formatted.message;
        const code =
          error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST'
            ? 'CONFIG_EXISTS'
            : formatted.code;
        sendJson(res, 400, { ok: false, error: message, code, details: formatted.details });
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      try {
        const config = await loadConfig();
        const engine = new ReviewEngine(config);
        const healthy = await engine.healthCheck();
        sendJson(res, 200, { ok: true, healthy });
      } catch (error) {
        logger.error({ error }, 'Health check failed');
        const formatted = formatError(error);
        sendJson(res, 500, {
          ok: false,
          error: formatted.message,
          code: formatted.code,
          details: formatted.details,
        });
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/review') {
      try {
        const payload = await readJsonBody(req);
        if (payload.configPath) {
          const ext = path.extname(payload.configPath).toLowerCase();
          if (!['.json', '.yaml', '.yml'].includes(ext)) {
            throw new PRReviewError(
              'Config files in UI mode must be JSON or YAML.',
              'VALIDATION_ERROR'
            );
          }
        }
        const rawConfig = applyRequestOverrides(await loadConfig(payload.configPath), payload);
        const config = validateConfig(rawConfig);

        const repoPath = payload.repoPath || process.cwd();
        const gitRepo = new GitRepositoryManager(repoPath);
        const mode = payload.mode || 'compare';

        let diffs;
        let sourceBranch = payload.sourceBranch || 'HEAD';
        let targetBranch = payload.targetBranch || 'main';

        if (mode === 'compare') {
          if (!payload.sourceBranch || !payload.targetBranch) {
            throw new PRReviewError('Source and target branches are required.', 'VALIDATION_ERROR');
          }
          validateBranchName(payload.sourceBranch);
          validateBranchName(payload.targetBranch);
          sourceBranch = payload.sourceBranch;
          targetBranch = payload.targetBranch;
          diffs = await gitRepo.getDiff(sourceBranch, targetBranch, config.git.maxDiffSize);
        } else {
          const baseBranch = payload.baseBranch || 'main';
          validateBranchName(baseBranch);
          const repoInfo = await gitRepo.getRepositoryInfo();
          sourceBranch = repoInfo.currentBranch;
          targetBranch = baseBranch;
          diffs = await gitRepo.getBranchDiff(baseBranch, config.git.maxDiffSize);
        }

        if (payload.files) {
          diffs = diffs.filter((diff) => minimatch(diff.filePath, payload.files!));
        }

        const engine = new ReviewEngine(config);
        const healthy = await engine.healthCheck();
        if (!healthy) {
          throw new PRReviewError(
            'LLM provider is not available. Please ensure your LLM server is running.',
            'LLM_UNAVAILABLE'
          );
        }

        const result = await engine.review(diffs, sourceBranch, targetBranch);
        applySeverityFilter(result, payload.severity);

        sendJson(res, 200, { ok: true, result });
      } catch (error) {
        logger.error({ error }, 'UI review failed');
        const formatted = formatError(error);
        sendJson(res, 400, {
          ok: false,
          error: formatted.message,
          code: formatted.code,
          details: formatted.details,
        });
      }
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Not found' });
  };

  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => resolve());
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : options.port;
  uiHtml = renderUI({ version: options.version, host: options.host, port });
  logger.info({ host: options.host, port }, 'UI server started');
  console.log(`UI available at http://${options.host}:${port}`);

  return {
    host: options.host,
    port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}
