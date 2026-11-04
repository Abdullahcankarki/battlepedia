interface SpinnerProps {
  label?: string;
  fullPage?: boolean;
}

/** Ladeanzeige, damit die Oberfläche bei langsamen Anfragen nicht einfriert. */
export function Spinner({ label = 'Loading…', fullPage = false }: SpinnerProps) {
  return (
    <div
      className={fullPage ? 'spinner spinner--full' : 'spinner'}
      role="status"
      aria-live="polite"
    >
      <span className="spinner__circle" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </div>
  );
}
