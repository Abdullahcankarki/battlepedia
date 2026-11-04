import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const BACKEND_LOG = process.env.BACKEND_LOG ?? '../backend/backend.log';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@battlepedia.local';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin-Passw0rd!';
const PASSWORD = 'Hastings-1066!';

/** Liest den Bestätigungslink aus dem Backend-Log (E-Mail-Versand ist im Test abgeschaltet). */
function verificationLink(email: string): string {
  const lines = readFileSync(BACKEND_LOG, 'utf8').split('\n');
  const line = lines.reverse().find((entry) => entry.includes(`für ${email}:`));
  const match = line?.match(/(https:\/\/\S+\/verify\?token=\S+)/);
  if (!match) {
    throw new Error(`Kein Bestätigungslink für ${email} im Log gefunden`);
  }
  return match[1];
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function registerAndConfirm(page: Page, username: string, email: string) {
  await page.goto('/register');
  await page.getByLabel('Display name').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();

  await page.goto(verificationLink(email));
  await expect(page.getByText('Your email address has been confirmed.')).toBeVisible();
}

test('register, confirm email, sign in with HttpOnly cookie and sign out', async ({
  page,
  context,
}) => {
  const email = `william-${Date.now()}@example.com`;

  await signIn(page, 'nobody@example.com', 'wrong-password');
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');

  await registerAndConfirm(page, `william${Date.now()}`, email);

  await signIn(page, email, PASSWORD);
  await expect(page.getByRole('heading', { name: /Welcome back, / })).toBeVisible();

  // Das Token liegt in einem HttpOnly-Cookie: im Browser vorhanden, für JavaScript unsichtbar.
  const cookies = await context.cookies();
  const tokenCookie = cookies.find((cookie) => cookie.name === 'access_token');
  expect(tokenCookie?.httpOnly).toBe(true);
  expect(tokenCookie?.secure).toBe(true);
  expect(tokenCookie?.sameSite).toBe('Strict');
  expect(await page.evaluate(() => document.cookie)).not.toContain('access_token');
  expect(await page.evaluate(() => JSON.stringify(window.localStorage))).toBe('{}');

  // Nach einem Neuladen ist man dank Cookie weiterhin angemeldet.
  await page.reload();
  await expect(page.getByRole('heading', { name: /Welcome back, / })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back', exact: true })).toBeVisible();
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});

test('admin can find and deactivate a user, who can no longer sign in', async ({ page }) => {
  const username = `harold${Date.now()}`;
  const email = `${username}@example.com`;
  await registerAndConfirm(page, username, email);

  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.getByRole('link', { name: 'Users' }).click();
  await page.getByLabel('Search users').fill(username);
  const row = page.getByRole('row', { name: new RegExp(username) });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Deactivate' }).click();
  await expect(row.getByText('Deactivated')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();

  await signIn(page, email, PASSWORD);
  await expect(page.getByRole('alert')).toHaveText('Your account has been deactivated.');
});

test('normal users are kept out of the user management', async ({ page }) => {
  const username = `saladin${Date.now()}`;
  await registerAndConfirm(page, username, `${username}@example.com`);
  await signIn(page, `${username}@example.com`, PASSWORD);
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/$/);
  const status = await page.evaluate(async () => (await fetch('/api/admin/users')).status);
  expect(status).toBe(403);
});

test('sign in works on a smartphone @mobile', async ({ page }) => {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page.getByRole('heading', { name: /Welcome back, / })).toBeVisible();
});
