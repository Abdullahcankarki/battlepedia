import { describe, expect, it } from 'vitest';
import { basicAuthHeader } from '../../api/authApi';
import { passwordStrength, validateRegisterForm } from './validation';

const VALID = {
  username: 'william',
  email: 'william@example.com',
  password: 'Hastings-1066!',
  confirmPassword: 'Hastings-1066!',
};

describe('validateRegisterForm', () => {
  it('accepts valid input', () => {
    expect(validateRegisterForm(VALID)).toEqual({});
  });

  it('reports every invalid field', () => {
    const errors = validateRegisterForm({
      username: 'a',
      email: 'no-email',
      password: 'short',
      confirmPassword: 'other',
    });
    expect(Object.keys(errors).sort()).toEqual([
      'confirmPassword',
      'email',
      'password',
      'username',
    ]);
  });

  it('requires a number and a special character', () => {
    const errors = validateRegisterForm({
      ...VALID,
      password: 'onlyletters',
      confirmPassword: 'onlyletters',
    });
    expect(errors.password).toContain('number');
  });
});

describe('passwordStrength', () => {
  it('rates long passwords with numbers and symbols highest', () => {
    expect(passwordStrength('abc')).toBe(0);
    expect(passwordStrength('Hastings-1066-Senlac!')).toBe(4);
  });
});

describe('basicAuthHeader', () => {
  it('encodes credentials as defined by RFC 7617', () => {
    expect(basicAuthHeader('a@b.de', 'pw')).toBe(`Basic ${btoa('a@b.de:pw')}`);
  });

  it('encodes umlauts as UTF-8', () => {
    expect(basicAuthHeader('a@b.de', 'ä')).toBe('Basic YUBiLmRlOsOk');
  });
});
