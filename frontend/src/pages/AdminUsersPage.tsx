import { useCallback, useEffect, useState } from 'react';
import type { User } from '../api/types';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Alert } from '../components/Alert';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Spinner } from '../components/Spinner';
import {
  clearUsersError,
  deleteUser,
  fetchUsers,
  setUserEnabled,
} from '../features/users/usersSlice';

const SEARCH_DELAY_MS = 300;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Userverwaltung für Administratoren: suchen, blättern, deaktivieren und löschen. */
export function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { page, loading, error, busyIds } = useAppSelector((state) => state.users);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const load = useCallback(() => {
    dispatch(fetchUsers({ search, page: pageNumber }));
  }, [dispatch, search, pageNumber]);

  useEffect(() => {
    load();
  }, [load]);

  // Suche erst starten, wenn 300 ms nicht mehr getippt wurde.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPageNumber(0);
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!userToDelete) {
      return;
    }
    const id = userToDelete.id;
    setUserToDelete(null);
    const result = await dispatch(deleteUser(id));
    if (deleteUser.fulfilled.match(result)) {
      const isLastOnPage = page?.content.length === 1 && pageNumber > 0;
      if (isLastOnPage) {
        setPageNumber(pageNumber - 1);
      } else {
        load();
      }
    }
  };

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Users</h1>
          <p className="muted">
            {page ? `${page.totalElements} registered users` : 'Manage registered accounts.'}
          </p>
        </div>
        <input
          type="search"
          className="input search"
          placeholder="Search by name or email…"
          aria-label="Search users"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      {error && (
        <Alert variant="error">
          {error}{' '}
          <button type="button" className="link" onClick={() => dispatch(clearUsersError())}>
            Dismiss
          </button>
        </Alert>
      )}

      <div className="card table-card">
        {loading && !page ? (
          <Spinner label="Loading users…" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {page?.content.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const busy = busyIds.includes(user.id);
                return (
                  <tr key={user.id}>
                    <td data-label="User">
                      <strong>{user.username}</strong>
                      <span className="table__sub">{user.email}</span>
                    </td>
                    <td data-label="Role">
                      <span className={user.role === 'ADMIN' ? 'tag tag--admin' : 'tag'}>
                        {user.role}
                      </span>
                    </td>
                    <td data-label="Status">
                      {!user.verified ? (
                        <span className="badge badge--pending">Unconfirmed</span>
                      ) : user.enabled ? (
                        <span className="badge badge--active">Active</span>
                      ) : (
                        <span className="badge badge--inactive">Deactivated</span>
                      )}
                    </td>
                    <td data-label="Registered">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="table__actions">
                        {isSelf ? (
                          <span className="muted">That's you</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn--ghost btn--small"
                              disabled={busy}
                              onClick={() =>
                                dispatch(setUserEnabled({ id: user.id, enabled: !user.enabled }))
                              }
                            >
                              {user.enabled ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger-ghost btn--small"
                              disabled={busy}
                              onClick={() => setUserToDelete(user)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {page?.content.length === 0 && (
                <tr>
                  <td colSpan={5} className="table__empty">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {loading && page && <div className="table-card__overlay" aria-hidden="true" />}
      </div>

      {page && page.totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination">
          <button
            type="button"
            className="btn btn--ghost btn--small"
            disabled={pageNumber === 0 || loading}
            onClick={() => setPageNumber(pageNumber - 1)}
          >
            ‹ Previous
          </button>
          <span>
            Page {page.page + 1} of {page.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            disabled={pageNumber + 1 >= page.totalPages || loading}
            onClick={() => setPageNumber(pageNumber + 1)}
          >
            Next ›
          </button>
        </nav>
      )}

      {userToDelete && (
        <ConfirmDialog
          title="Delete user?"
          message={`The account of ${userToDelete.username} (${userToDelete.email}) will be deleted permanently.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </section>
  );
}
