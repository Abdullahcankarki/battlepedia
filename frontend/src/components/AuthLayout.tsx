import type { ReactNode } from 'react';

interface AuthLayoutProps {
  quote?: ReactNode;
  children: ReactNode;
}

/** Zweigeteilte Seite für Login und Registrierung: links Illustration, rechts Formular. */
export function AuthLayout({ quote, children }: AuthLayoutProps) {
  return (
    <div className="auth">
      <div className="auth__art" aria-hidden="true">
        <svg viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1E2633" />
              <stop offset="0.6" stopColor="#3A4556" />
              <stop offset="1" stopColor="#8C6A55" />
            </linearGradient>
          </defs>
          <rect width="800" height="900" fill="url(#sky)" />
          <circle cx="560" cy="560" r="160" fill="#D9B98A" opacity="0.18" />
          <path d="M0 640 Q200 560 400 610 T800 590 V900 H0Z" fill="#4E4448" />
          <path d="M0 720 Q240 650 460 700 T800 680 V900 H0Z" fill="#383541" />
          <path d="M0 800 Q260 740 520 790 T800 770 V900 H0Z" fill="#262A36" />
          <g stroke="#1d212c" strokeWidth="2">
            <line x1="90" y1="700" x2="92" y2="660" />
            <line x1="110" y1="696" x2="112" y2="656" />
            <line x1="130" y1="692" x2="132" y2="652" />
            <line x1="150" y1="690" x2="152" y2="650" />
            <line x1="170" y1="688" x2="172" y2="648" />
            <line x1="610" y1="676" x2="608" y2="636" />
            <line x1="630" y1="678" x2="628" y2="638" />
            <line x1="650" y1="680" x2="648" y2="640" />
            <line x1="670" y1="682" x2="668" y2="642" />
          </g>
          <path d="M152 650 l26 7 l-26 8z" fill="#9E2A2B" />
          <path d="M648 640 l-26 7 l26 8z" fill="#2F5D7C" />
        </svg>
        {quote && <div className="auth__quote">{quote}</div>}
      </div>
      <div className="auth__form">
        <div className="auth__box">{children}</div>
      </div>
    </div>
  );
}
