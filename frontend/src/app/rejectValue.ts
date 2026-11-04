import { ApiError } from '../api/client';

/** Serialisierbare Fehlerinformation für abgelehnte Redux-Thunks. */
export interface RejectValue {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
}

export function toRejectValue(error: unknown): RejectValue {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message, fieldErrors: error.fieldErrors };
  }
  return { status: 0, message: 'Something went wrong. Please try again.', fieldErrors: {} };
}
