import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import type { Role } from '../api/types';

/**
 * Schützt Seiten vor nicht angemeldeten Nutzern. Mit role="ADMIN" nur für Administratoren.
 * Die eigentliche Sicherheit liegt im Backend – das hier verhindert nur, dass leere Seiten erscheinen.
 */
export function ProtectedRoute({ role }: { role?: Role }) {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/** Login und Registrierung nur für nicht angemeldete Nutzer. Nach dem Login geht es zur ursprünglichen Seite. */
export function GuestRoute() {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  return user ? <Navigate to={from} replace /> : <Outlet />;
}
