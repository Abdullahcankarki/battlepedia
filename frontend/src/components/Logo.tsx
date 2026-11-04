/** Logo: Kartenmarkierung mit gekreuzten Schwertern (Symbol für einen Schlachtort). */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 68) / 60} viewBox="0 0 60 68" aria-hidden="true">
      <path
        d="M30,2 C14,2 4,14 4,28 C4,46 30,66 30,66 C30,66 56,46 56,28 C56,14 46,2 30,2Z"
        fill="#9E2A2B"
      />
      <g stroke="#F4EEE2" strokeWidth="4" strokeLinecap="round">
        <line x1="18" y1="16" x2="42" y2="40" />
        <line x1="42" y1="16" x2="18" y2="40" />
      </g>
      <g stroke="#B08D57" strokeWidth="4" strokeLinecap="round">
        <line x1="14" y1="37" x2="21" y2="44" />
        <line x1="46" y1="37" x2="39" y2="44" />
      </g>
      <circle cx="30" cy="28" r="3.2" fill="#B08D57" />
    </svg>
  );
}
