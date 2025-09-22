import { environment } from '~/config/environment';

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type QueryParamValue = string | number | boolean | undefined;

type RequestOptions = Omit<RequestInit, 'body'> & {
  searchParams?: Record<string, QueryParamValue>;
  json?: unknown;
  body?: BodyInit | null;
};

const JSON_CONTENT_TYPE = 'application/json';

function buildUrl(path: string, searchParams?: Record<string, QueryParamValue>): string {
  const base = environment.apiBaseUrl.endsWith('/')
    ? environment.apiBaseUrl
    : `${environment.apiBaseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, base);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

function parseResponseBody(rawBody: string, contentType: string | null): unknown {
  if (!rawBody) {
    return undefined;
  }

  if (contentType?.includes(JSON_CONTENT_TYPE)) {
    try {
      return JSON.parse(rawBody) as unknown;
    } catch (error) {
      console.warn('Failed to parse JSON response', error);
      return rawBody;
    }
  }

  return rawBody;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { searchParams, headers, json, body: providedBody, method, ...init } = options;
  const url = buildUrl(path, searchParams);
  const mergedHeaders = new Headers({ Accept: JSON_CONTENT_TYPE });

  if (headers) {
    const additional = new Headers(headers as HeadersInit);
    additional.forEach((value, key) => {
      mergedHeaders.set(key, value);
    });
  }

  if (json !== undefined) {
    mergedHeaders.set('Content-Type', JSON_CONTENT_TYPE);
  }

  const requestBody = json !== undefined ? JSON.stringify(json) : providedBody ?? undefined;

  const response = await fetch(url, {
    ...init,
    method: method ?? 'GET',
    headers: mergedHeaders,
    body: requestBody,
  });

  const rawBody = await response.text();
  const parsedBody = parseResponseBody(rawBody, response.headers.get('content-type'));

  if (!response.ok) {
    const message =
      typeof parsedBody === 'object' && parsedBody !== null && 'message' in parsedBody
        ? String((parsedBody as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, parsedBody);
  }

  return parsedBody as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST' }),
  put: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT' }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
