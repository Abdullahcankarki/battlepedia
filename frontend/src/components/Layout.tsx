import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { Logo } from './Logo';

/** Grundgerüst jeder Seite: Kopfzeile mit Navigation, Inhalt und Fußzeile. */
export function Layout() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <Link to="/" className="brand">
            <Logo />
            <span>Battlepedia</span>
          </Link>
          {user && (
            <nav className="nav" aria-label="Main navigation">
              <NavLink to="/" end>
                Home
              </NavLink>
              {user.role === 'ADMIN' && <NavLink to="/admin/users">Users</NavLink>}
            </nav>
          )}
          <div className="header__actions">
            {user ? (
              <>
                <span className="avatar" title={user.email} aria-hidden="true">
                  {user.username.slice(0, 2).toUpperCase()}
                </span>
                <span className="header__user">{user.username}</span>
                <button
                  type="button"
                  className="btn btn--ghost-light btn--small"
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost-light btn--small">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn--primary btn--small">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <span>© 2026 Battlepedia · Student project, BHT Berlin</span>
      </footer>
    </div>
  );
}
