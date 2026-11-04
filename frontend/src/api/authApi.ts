import { request } from './client';
import type { MessageResponse, User } from './types';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

/**
 * Baut den Header für Basic-Authentication nach RFC 7617: "Basic " + Base64("email:passwort").
 * TextEncoder sorgt dafür, dass auch Umlaute im Passwort korrekt als UTF-8 übertragen werden.
 */
export function basicAuthHeader(email: string, password: string): string {
  const bytes = new TextEncoder().encode(`${email}:${password}`);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return `Basic ${btoa(binary)}`;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<User>('/auth/login', {
      method: 'POST',
      headers: { Authorization: basicAuthHeader(email, password) },
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/auth/me'),
  register: (data: RegisterData) =>
    request<MessageResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  verify: (token: string) =>
    request<MessageResponse>(`/auth/verify?token=${encodeURIComponent(token)}`),
  resendVerification: (email: string) =>
    request<MessageResponse>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
