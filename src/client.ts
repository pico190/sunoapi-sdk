/**
 * Low-level HTTP client for the SunoAPI SDK.
 *
 * Handles authentication, the two different response envelopes (main/voice vs
 * file-upload), JSON (de)serialization, query-string building, multipart
 * uploads, timeouts and exponential-backoff retries on transient failures.
 *
 * @internal
 */
import { ApiResponse, UploadApiResponse } from './types.js';
import { SunoAPIError } from './errors.js';

/** Configuration accepted by {@link HttpClient} (and the top-level SDK). */
export interface SunoAPIOptions {
  /** Your SunoAPI Bearer token. */
  apiKey: string;
  /** Override the main/voice API base URL. @default 'https://api.sunoapi.org' */
  baseURL?: string;
  /** Override the file-upload API base URL. @default 'https://sunoapiorg.redpandaai.co' */
  uploadBaseURL?: string;
  /** Per-request timeout in milliseconds. @default 60000 */
  timeoutMs?: number;
  /** Maximum retries on 429 / 5xx / network errors. @default 3 */
  maxRetries?: number;
  /** Base backoff in milliseconds between retries. @default 500 */
  retryDelayMs?: number;
}

const DEFAULT_BASE_URL = 'https://api.sunoapi.org';
const DEFAULT_UPLOAD_BASE_URL = 'https://sunoapiorg.redpandaai.co';

/**
 * Minimal delay utility.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Query-string builder that drops `undefined` / `null` values. */
function buildQuery(query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly uploadBaseURL: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(opts: SunoAPIOptions) {
    if (!opts.apiKey) {
      throw new Error('SunoAPI: `apiKey` is required to initialize the SDK.');
    }
    this.apiKey = opts.apiKey;
    this.baseURL = (opts.baseURL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.uploadBaseURL = (opts.uploadBaseURL ?? DEFAULT_UPLOAD_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs ?? 60_000;
    this.maxRetries = opts.maxRetries ?? 3;
    this.retryDelayMs = opts.retryDelayMs ?? 500;
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  /**
   * Perform a `fetch` with exponential-backoff retries on transient failures
   * (network errors, HTTP 429 and 5xx). Honors a per-request timeout.
   */
  private async fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
    let attempt = 0;
    let lastErr: unknown;

    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timer);

        // Retryable server/rate-limit statuses.
        if (res.status === 429 || res.status >= 500) {
          if (attempt < this.maxRetries) {
            attempt += 1;
            await delay(this.retryDelayMs * Math.pow(2, attempt - 1));
            continue;
          }
          return res;
        }
        return res;
      } catch (err) {
        lastErr = err;
        clearTimeout(timer);
        if (attempt < this.maxRetries) {
          attempt += 1;
          await delay(this.retryDelayMs * Math.pow(2, attempt - 1));
          continue;
        }
        break;
      }
    }
    throw lastErr ?? new Error('SunoAPI: request failed after retries');
  }

  /**
   * Call a main/voice API endpoint and unwrap the `data` field.
   *
   * @throws {SunoAPIError} when the envelope `code` is not `200`.
   */
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    opts?: {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined>;
    },
  ): Promise<T> {
    const url = `${this.baseURL}${path}${buildQuery(opts?.query)}`;
    const init: RequestInit = {
      method,
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json',
      },
    };
    if (opts?.body !== undefined) {
      init.body = JSON.stringify(opts.body);
    }

    const res = await this.fetchWithRetry(url, init);
    const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
    if (json.code !== 200) {
      throw new SunoAPIError(json.code, json.msg || 'Unknown error');
    }
    return json.data;
  }

  /**
   * Call a file-upload API endpoint (JSON or multipart) and unwrap `data`.
   *
   * @throws {SunoAPIError} when the envelope `success` is not `true`.
   */
  async requestUpload<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    opts?: { body?: unknown; form?: FormData },
  ): Promise<T> {
    const url = `${this.uploadBaseURL}${path}`;
    let init: RequestInit;
    if (opts?.form) {
      // Do NOT set Content-Type — fetch will add the multipart boundary.
      init = { method, headers: this.authHeaders(), body: opts.form };
    } else {
      init = {
        method,
        headers: { ...this.authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(opts?.body),
      };
    }

    const res = await this.fetchWithRetry(url, init);
    const json = (await res.json().catch(() => ({}))) as UploadApiResponse<T>;
    if (!json.success) {
      throw new SunoAPIError(json.code, json.msg || 'Upload failed');
    }
    return json.data;
  }
}
