import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}

/** Eingabefeld mit Beschriftung, Hinweis und Fehlermeldung. */
export function TextField({ label, name, error, hint, ...inputProps }: TextFieldProps) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        className={error ? 'input input--invalid' : 'input'}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error ? (
        <span id={`${name}-error`} className="field__error">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${name}-hint`} className="field__hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
