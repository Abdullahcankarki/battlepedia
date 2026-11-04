export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  enabled: boolean;
  verified: boolean;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MessageResponse {
  message: string;
}

/** Fehlerformat des Backends (ApiError.java). */
export interface ApiErrorBody {
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}
