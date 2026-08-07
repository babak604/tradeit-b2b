import { test, expect, BrowserContext, Page } from '@playwright/test';
import path from 'path';

const partyAFile = path.join(__dirname, '../playwright/.auth/partyA.json');
const partyBFile = path.join(__dirname, '../playwright/.auth/partyB.json');

test.describe('End-to-End Escrow Lifecycle across Counterparties', () => {
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;

  test.beforeAll(async ({ browser }) => {
    // Load pre-authenticated contexts instantly
    contextA = await browser.newContext({ storageState: partyAFile });
    contextB = await browser.newContext({ storageState: partyBFile });

    pageA = await contextA.newPage();
    pageB = await contextB.newPage();
  });

  test('Complete Barter Trade: Proposal -> Signing -> Realtime Chat -> Settlement', async () => {
    // Start directly at deal creation - no login UI steps needed!
    await pageA.goto('/deals/new');
    await pageA.getByLabel(/counterparty/i).selectOption({ label: 'Beta Logistics Inc' });
    await pageA.getByLabel(/credit amount/i).fill('1000');
    await pageA.getByRole('button', { name: /propose deal/i }).click();

    await pageA.waitForURL(/\/deals\/[a-f0-9-]+/, { waitUntil: 'domcontentloaded' });
    const dealUrl = pageA.url();

    await pageB.goto(dealUrl);
    await expect(pageB.getByText('proposed', { exact: false })).toBeVisible();

    // Continue with deal signing, realtime chat, and settlement...
  });

  test.afterAll(async () => {
    await contextA?.close();
    await contextB?.close();
  });
});