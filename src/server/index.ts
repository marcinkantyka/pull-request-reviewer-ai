import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { minimatch } from 'minimatch';
import path from 'node:path';
import fs from 'node:fs/promises';
import { loadConfig } from '../core/storage/config.js';
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
    seed?: number;
  };
  network?: {
    allowedHosts?: string[];
  };
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

function sanitizeConfig(config: AppConfig) {
  const { llm, network, review } = config;
  return {
    llm: {
      endpoint: llm.endpoint,
      provider: llm.provider,
      model: llm.model,
      temperature: llm.temperature,
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
    },
  };
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
  if (payload.llm?.seed !== undefined) {
    config.llm.seed = payload.llm.seed;
  }
  if (payload.network?.allowedHosts && payload.network.allowedHosts.length > 0) {
    config.network.allowedHosts = payload.network.allowedHosts;
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

async function listDirectories(targetPath?: string) {
  const resolved = path.resolve(targetPath || process.cwd());
  const stats = await fs.stat(resolved);
  if (!stats.isDirectory()) {
    throw new Error('Path is not a directory');
  }

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

export async function startServer(options: ServerOptions): Promise<void> {
  let uiHtml = '';

  const server = createServer(async (req, res) => {
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
        sendJson(res, 500, { ok: false, error: String(error) });
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/fs') {
      try {
        const targetPath = url.searchParams.get('path') || undefined;
        const listing = await listDirectories(targetPath);
        sendJson(res, 200, { ok: true, ...listing });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: String(error) });
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/models') {
      try {
        const config = await loadConfig();
        const endpoint = url.searchParams.get('endpoint') || config.llm.endpoint;

        if (config.llm.provider !== 'ollama') {
          sendJson(res, 200, { ok: true, supported: false, models: [] });
          return;
        }

        const tagsUrl = new URL('/api/tags', endpoint).toString();
        const secureFetch = createSecureFetch(config.network.allowedHosts);
        const response = await secureFetch(tagsUrl);
        if (!response.ok) {
          sendJson(res, 200, { ok: true, supported: true, models: [] });
          return;
        }
        const data = (await response.json()) as { models?: Array<{ name?: string }> };
        const models = (data.models || [])
          .map((model) => model.name)
          .filter((name): name is string => Boolean(name))
          .sort((a, b) => a.localeCompare(b));

        sendJson(res, 200, { ok: true, supported: true, models });
      } catch (error) {
        sendJson(res, 200, { ok: true, supported: false, models: [] });
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
        sendJson(res, 500, { ok: false, error: String(error) });
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
        const message = error instanceof Error ? error.message : String(error);
        sendJson(res, 400, { ok: false, error: message });
      }
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Not found' });
  });

  server.listen(options.port, options.host, () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : options.port;
    uiHtml = renderUI({ version: options.version, host: options.host, port });
    logger.info({ host: options.host, port }, 'UI server started');
    console.log(`UI available at http://${options.host}:${port}`);
  });
}
