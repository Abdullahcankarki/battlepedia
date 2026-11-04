import { Link } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

const UPCOMING = [
  { title: 'Battles', text: 'Search and filter battles by era, region and type.' },
  { title: 'Map & timeline', text: 'See where and when battles happened.' },
  { title: 'Commanders & factions', text: 'Profiles with every battle they took part in.' },
];

export function HomePage() {
  const user = useAppSelector((state) => state.auth.user);
  if (!user) {
    return null;
  }
  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <p className="eyebrow eyebrow--light">The encyclopedia of historical battles</p>
          <h1>
            Welcome back, <em>{user.username}</em>.
          </h1>
          <p className="hero__lead">
            You are signed in as <strong>{user.email}</strong>
            {user.role === 'ADMIN' && ' with administrator rights'}.
          </p>
          {user.role === 'ADMIN' && (
            <Link to="/admin/users" className="btn btn--primary">
              Manage users
            </Link>
          )}
        </div>
      </section>
      <section className="page">
        <p className="eyebrow">Coming next</p>
        <h2>What you will find here soon</h2>
        <div className="grid grid--3">
          {UPCOMING.map((item) => (
            <article key={item.title} className="card card--padded">
              <h3>{item.title}</h3>
              <p className="muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
