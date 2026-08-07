import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authDir = path.join(__dirname, '../playwright/.auth');
export const partyAFile = path.join(authDir, 'partyA.json');
export const partyBFile = path.join(authDir, 'partyB.json');

setup('authenticate Party A', async ({ page }) => {
  // Capture any browser console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`Browser Console Error: ${msg.text()}`);
  });

  // Capture any failed network request (API, Server Actions, or Supabase)
  page.on('response', async response => {
    if (!response.ok() && !response.url().includes('/_next/static')) {
      console.error(`\n❌ Failed Request [${response.status()}] ${response.url()}:`, await response.text().catch(() => 'No body'));
    }
  });

  await page.goto('/login');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill('partya@alphatech.com');
  await passwordInput.fill('Password123!');

  await expect(emailInput).toHaveValue('partya@alphatech.com');
  await expect(passwordInput).toHaveValue('Password123!');

  await page.getByRole('button', { name: /^log in$/i }).click();

  await expect(page).toHaveURL(/\/deals|\/dashboard/, { timeout: 10000 });
  await page.context().storageState({ path: partyAFile });
});

setup('authenticate Party B', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`Browser Console Error: ${msg.text()}`);
  });

  page.on('response', async response => {
    if (!response.ok() && !response.url().includes('/_next/static')) {
      console.error(`\n❌ Failed Request [${response.status()}] ${response.url()}:`, await response.text().catch(() => 'No body'));
    }
  });

  await page.goto('/login');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill('partyb@betalogistics.com');
  await passwordInput.fill('Password123!');

  await expect(emailInput).toHaveValue('partyb@betalogistics.com');
  await expect(passwordInput).toHaveValue('Password123!');

  await page.getByRole('button', { name: /^log in$/i }).click();

  await expect(page).toHaveURL(/\/deals|\/dashboard/, { timeout: 10000 });
  await page.context().storageState({ path: partyBFile });
});