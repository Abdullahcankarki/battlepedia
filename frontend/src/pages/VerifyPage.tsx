import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/client';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { ResendVerification } from '../features/auth/ResendVerification';

type VerifyState = { status: 'loading' } | { status: 'success' | 'error'; message: string };

/** Wird über den Link aus der E-Mail geöffnet und bestätigt die E-Mail-Adresse. */
export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>(
    token
      ? { status: 'loading' }
      : { status: 'error', message: 'The confirmation link is incomplete.' },
  );
  // Verhindert, dass der Code doppelt gesendet wird (React ruft Effekte im Entwicklungsmodus zweimal auf).
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) {
      return;
    }
    requested.current = true;
    authApi
      .verify(token)
      .then((response) => setState({ status: 'success', message: response.message }))
      .catch((err: unknown) =>
        setState({
          status: 'error',
          message: err instanceof ApiError ? err.message : 'Your email could not be confirmed.',
        }),
      );
  }, [token]);

  return (
    <section className="page page--narrow">
      <div className="card card--padded center">
        <h1>Email confirmation</h1>
        {state.status === 'loading' && <Spinner label="Confirming your email address…" />}
        {state.status === 'success' && (
          <>
            <Alert variant="success">{state.message}</Alert>
            <Link to="/login" className="btn btn--primary">
              Sign in
            </Link>
          </>
        )}
        {state.status === 'error' && (
          <>
            <Alert variant="error">{state.message}</Alert>
            <ResendVerification />
          </>
        )}
      </div>
    </section>
  );
}
