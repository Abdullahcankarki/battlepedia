import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/client';
import { Alert } from '../components/Alert';
import { AuthLayout } from '../components/AuthLayout';
import { TextField } from '../components/TextField';
import { ResendVerification } from '../features/auth/ResendVerification';
import {
  passwordStrength,
  validateRegisterForm,
  type RegisterForm,
} from '../features/auth/validation';

const EMPTY_FORM: RegisterForm = { username: '', email: '', password: '', confirmPassword: '' };

export function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateRegisterForm(form);
    setErrors(validationErrors);
    setServerError(null);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      const response = await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSuccessMessage(response.message);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setServerError(err.message);
      } else {
        setServerError('Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(form.password);

  return (
    <AuthLayout
      quote={
        <>
          <p className="eyebrow eyebrow--light">With a free account you can</p>
          <ul className="auth__benefits">
            <li>Save battles in collections with notes</li>
            <li>Discuss battles with other readers</li>
            <li>Use presentation mode in class</li>
          </ul>
        </>
      }
    >
      <ol className="steps" aria-label="Registration progress">
        <li className="steps__item steps__item--done">1 · Account</li>
        <li className={successMessage ? 'steps__item steps__item--done' : 'steps__item'}>
          2 · Verify email
        </li>
        <li className="steps__item">3 · Done</li>
      </ol>

      {successMessage ? (
        <div className="verify-sent">
          <h1>Check your inbox</h1>
          <Alert variant="success">{successMessage}</Alert>
          <p className="muted">
            We sent a confirmation link to <strong>{form.email.trim()}</strong>. The link is valid
            for 24 hours.
          </p>
          <ResendVerification initialEmail={form.email.trim()} />
          <p className="auth__switch">
            Already confirmed? <Link to="/login">Sign in</Link>
          </p>
        </div>
      ) : (
        <>
          <h1>Create your account</h1>
          <p className="muted">It takes less than a minute.</p>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Display name"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              hint="Shown next to your comments."
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              hint="At least 10 characters, one number and one special character."
            />
            <div className="strength" aria-hidden="true">
              {[1, 2, 3, 4].map((level) => (
                <i key={level} className={strength >= level ? 'strength__bar--on' : ''} />
              ))}
            </div>
            <TextField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />
            {serverError && <Alert variant="error">{serverError}</Alert>}
            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="auth__switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
