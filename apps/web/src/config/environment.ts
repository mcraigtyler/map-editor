const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

type Environment = {
  apiBaseUrl: string;
};

function sanitize(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const apiBaseUrl = sanitize(import.meta.env.VITE_API_BASE_URL) ?? DEFAULT_API_BASE_URL;

export const environment: Environment = Object.freeze({
  apiBaseUrl,
});
