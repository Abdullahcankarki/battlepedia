import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Sicherheitsabfrage vor gefährlichen Aktionen wie dem Löschen eines Users. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog ref={dialogRef} className="dialog" onCancel={onCancel} aria-labelledby="dialog-title">
      <h2 id="dialog-title">{title}</h2>
      <p>{message}</p>
      <div className="dialog__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
