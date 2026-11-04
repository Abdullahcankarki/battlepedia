import { request } from './client';
import type { Page, User } from './types';

export const usersApi = {
  list: (search: string, page: number, size: number) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search.trim()) {
      params.set('search', search.trim());
    }
    return request<Page<User>>(`/admin/users?${params.toString()}`);
  },
  setEnabled: (id: number, enabled: boolean) =>
    request<User>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  remove: (id: number) => request<void>(`/admin/users/${id}`, { method: 'DELETE' }),
};
