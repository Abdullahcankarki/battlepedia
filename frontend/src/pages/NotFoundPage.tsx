import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="page page--narrow center">
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn--primary">
        Back to home
      </Link>
    </section>
  );
}
