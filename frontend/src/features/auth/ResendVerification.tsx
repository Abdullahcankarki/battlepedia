import { useState, type FormEvent } from 'react';
import { authApi } from '../../api/authApi';
import { ApiError } from '../../api/client';
import { Alert } from '../../components/Alert';

/** Kleines Formular, um den Bestätigungslink erneut anzufordern. */
export function ResendVerification({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const response = await authApi.resendVerification(email);
      setMessage(response.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The link could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (message) {
    return <Alert variant="success">{message}</Alert>;
  }
  return (
    <form className="resend" onSubmit={handleSubmit}>
      <label htmlFor="resend-email">Send a new confirmation link</label>
      <div className="resend__row">
        <input
          id="resend-email"
          type="email"
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
        <button type="submit" className="btn btn--dark" disabled={sending}>
          {sending ? 'Sending…' : 'Send link'}
        </button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
    </form>
  );
}
