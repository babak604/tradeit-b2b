# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate Party B
- Location: e2e\auth.setup.ts:38:6

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/deals|\/dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    21 × locator resolved to <html lang="en" class="dark">…</html>
       - unexpected value "http://localhost:3000/login"

```

```yaml
- heading "TradeIt B2B" [level=2]
- text: "{} Email"
- textbox
- text: Password
- textbox
- button "Log In"
- button "Sign Up"
```

# Test source

```ts
  1  | import { test as setup, expect } from '@playwright/test';
  2  | import path from 'path';
  3  | 
  4  | const authDir = path.join(__dirname, '../playwright/.auth');
  5  | export const partyAFile = path.join(authDir, 'partyA.json');
  6  | export const partyBFile = path.join(authDir, 'partyB.json');
  7  | 
  8  | setup('authenticate Party A', async ({ page }) => {
  9  |   // Capture any browser console errors
  10 |   page.on('console', msg => {
  11 |     if (msg.type() === 'error') console.error(`Browser Console Error: ${msg.text()}`);
  12 |   });
  13 | 
  14 |   // Capture any failed network request (API, Server Actions, or Supabase)
  15 |   page.on('response', async response => {
  16 |     if (!response.ok() && !response.url().includes('/_next/static')) {
  17 |       console.error(`\n❌ Failed Request [${response.status()}] ${response.url()}:`, await response.text().catch(() => 'No body'));
  18 |     }
  19 |   });
  20 | 
  21 |   await page.goto('/login');
  22 | 
  23 |   const emailInput = page.locator('input[type="email"]');
  24 |   const passwordInput = page.locator('input[type="password"]');
  25 | 
  26 |   await emailInput.fill('partya@alphatech.com');
  27 |   await passwordInput.fill('Password123!');
  28 | 
  29 |   await expect(emailInput).toHaveValue('partya@alphatech.com');
  30 |   await expect(passwordInput).toHaveValue('Password123!');
  31 | 
  32 |   await page.getByRole('button', { name: /^log in$/i }).click();
  33 | 
  34 |   await expect(page).toHaveURL(/\/deals|\/dashboard/, { timeout: 10000 });
  35 |   await page.context().storageState({ path: partyAFile });
  36 | });
  37 | 
  38 | setup('authenticate Party B', async ({ page }) => {
  39 |   page.on('console', msg => {
  40 |     if (msg.type() === 'error') console.error(`Browser Console Error: ${msg.text()}`);
  41 |   });
  42 | 
  43 |   page.on('response', async response => {
  44 |     if (!response.ok() && !response.url().includes('/_next/static')) {
  45 |       console.error(`\n❌ Failed Request [${response.status()}] ${response.url()}:`, await response.text().catch(() => 'No body'));
  46 |     }
  47 |   });
  48 | 
  49 |   await page.goto('/login');
  50 | 
  51 |   const emailInput = page.locator('input[type="email"]');
  52 |   const passwordInput = page.locator('input[type="password"]');
  53 | 
  54 |   await emailInput.fill('partyb@betalogistics.com');
  55 |   await passwordInput.fill('Password123!');
  56 | 
  57 |   await expect(emailInput).toHaveValue('partyb@betalogistics.com');
  58 |   await expect(passwordInput).toHaveValue('Password123!');
  59 | 
  60 |   await page.getByRole('button', { name: /^log in$/i }).click();
  61 | 
> 62 |   await expect(page).toHaveURL(/\/deals|\/dashboard/, { timeout: 10000 });
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  63 |   await page.context().storageState({ path: partyBFile });
  64 | });
```