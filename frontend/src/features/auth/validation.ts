/** Prüft das Registrierungsformular mit denselben Regeln wie das Backend (RegisterRequest.java). */
export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function validateRegisterForm(form: RegisterForm): Record<string, string> {
  const errors: Record<string, string> = {};
  const username = form.username.trim();
  if (username.length < 3 || username.length > 50) {
    errors.username = 'Username must be 3 to 50 characters long.';
  } else if (!/^[A-Za-z0-9_.-]+$/.test(username)) {
    errors.username = 'Username may only contain letters, numbers, dots, dashes and underscores.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (form.password.length < 10 || form.password.length > 72) {
    errors.password = 'Password must be 10 to 72 characters long.';
  } else if (!/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
    errors.password = 'Password must contain at least one number and one special character.';
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

/** Stärke des Passworts von 0 bis 4 für die Anzeige unter dem Eingabefeld. */
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (/\d/.test(password) && /[A-Za-z]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}
