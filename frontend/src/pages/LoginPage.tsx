import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Alert } from '../components/Alert';
import { AuthLayout } from '../components/AuthLayout';
import { Logo } from '../components/Logo';
import { TextField } from '../components/TextField';
import { ResendVerification } from '../features/auth/ResendVerification';
import { clearAuthError, login } from '../features/auth/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const needsVerification = error?.status === 403 && error.message.includes('confirm');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Nach erfolgreichem Login leitet GuestRoute automatisch zur gewünschten Seite weiter.
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    dispatch(login({ email: email.trim(), password }));
  };

  return (
    <AuthLayout
      quote={
        <>
          <blockquote>“Those who cannot remember the past are condemned to repeat it.”</blockquote>
          <span>
            — George Santayana, <i>The Life of Reason</i> (1905)
          </span>
        </>
      }
    >
      <Logo size={44} />
      <h1>Welcome back</h1>
      <p className="muted">Sign in to access your bookmarks and join the discussion.</p>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && <Alert variant="error">{error.message}</Alert>}
        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={loading || !email || !password}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {needsVerification && <ResendVerification initialEmail={email} />}
      <p className="auth__switch">
        New to Battlepedia? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
