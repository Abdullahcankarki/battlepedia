import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { Layout } from './components/Layout';
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute';
import { Spinner } from './components/Spinner';
import { fetchCurrentUser } from './features/auth/authSlice';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyPage } from './pages/VerifyPage';

export function App() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((state) => state.auth.initialized);

  // Beim Start prüfen, ob noch ein gültiges Login-Cookie existiert.
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  if (!initialized) {
    return <Spinner label="Loading Battlepedia…" fullPage />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="/verify" element={<VerifyPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
