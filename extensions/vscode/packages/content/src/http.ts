import { ReactPressApiError, ReactPressClientOptions } from './types';

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  msg?: string;
  statusCode?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.replace(/\/+$/, '');
}

export class ReactPressHttp {
  readonly apiUrl: string;
  token?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: ReactPressClientOptions) {
    this.apiUrl = normalizeApiUrl(options.apiUrl);
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  setToken(token?: string): void {
    this.token = token;
  }

  async request<T>(
    method: string,
    path: string,
    init: {
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      formData?: FormData;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = new URL(`${this.apiUrl}${path.startsWith('/') ? path : `/${path}`}`);
    if (init.query) {
      for (const [key, value] of Object.entries(init.query)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = { ...(init.headers ?? {}) };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let body: BodyInit | undefined;
    if (init.formData) {
      body = init.formData;
    } else if (init.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(init.body);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method,
        headers,
        body,
        signal: controller.signal,
      });
    } catch (error) {
      // AbortError (including DOMException) or a raced abort after fetch threw.
      const aborted =
        controller.signal.aborted || (error instanceof Error && error.name === 'AbortError');
      if (aborted) {
        throw new ReactPressApiError(
          `Request timed out after ${this.timeoutMs}ms: ${method} ${path}`,
          408
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let json: ApiEnvelope<T> | null = null;
    if (text) {
      try {
        json = JSON.parse(text) as ApiEnvelope<T>;
      } catch {
        throw new ReactPressApiError(
          `Invalid JSON from ${method} ${path}: ${text.slice(0, 200)}`,
          response.status,
          text
        );
      }
    }

    if (!response.ok || (json && json.success === false)) {
      const message =
        (json?.msg && String(json.msg)) ||
        `Request failed: ${method} ${path} (${response.status})`;
      throw new ReactPressApiError(message, json?.statusCode ?? response.status, json ?? text);
    }

    if (json && Object.prototype.hasOwnProperty.call(json, 'data')) {
      // Mock / misconfigured gateways often return `{ success: true, data: null }`.
      // Treat that as failure so callers do not crash later on null article payloads.
      if (json.data == null) {
        throw new ReactPressApiError(
          `Empty API data from ${method} ${path}`,
          json.statusCode ?? response.status,
          json
        );
      }
      return json.data as T;
    }

    return json as unknown as T;
  }

  get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    return this.request<T>('GET', path, { query });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  postForm<T>(path: string, formData: FormData, query?: Record<string, string | number | undefined>): Promise<T> {
    return this.request<T>('POST', path, { formData, query });
  }
}
