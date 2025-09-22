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
  const { searchParams, headers, ...init } = options;
  const url = buildUrl(path, searchParams);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: JSON_CONTENT_TYPE,
      ...headers,
    },
    ...init,
  });

  const rawBody = await response.text();
  const body = parseResponseBody(rawBody, response.headers.get('content-type'));

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
};
