import { config } from '../config';
import type { ApiErrorBody } from './types';

/** Fehler einer API-Anfrage mit HTTP-Status und optionalen Fehlern je Formularfeld. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Zentrale Funktion für alle Aufrufe des Backends.
 * credentials: 'include' sorgt dafür, dass der Browser das HttpOnly-Cookie mit dem Token mitschickt.
 * Das Token selbst ist für JavaScript unsichtbar und liegt nie im LocalStorage.
 */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'The server cannot be reached. Please check your connection.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.message ?? 'Something went wrong. Please try again.',
      body?.fieldErrors,
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
