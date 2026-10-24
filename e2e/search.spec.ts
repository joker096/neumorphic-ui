import { test, expect, Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

/**
 * Global search: message query with deep-link, no-results state,
 * keyboard navigation, search history persistence and clearing.
 */

async function openGlobalSearch(page: Page) {
  await ensureAppReady(page);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('Global search', () => {
  test('querying a message opens the chat with the matched message', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    const input = dialog.locator('input');
    await input.fill('colors');

    const row = dialog.getByRole('button', { name: 'Alice Freeman' });
    await expect(row).toBeVisible();
    // Snippet from the matched message is shown in the row
    await expect(row.getByText(/dashboard/)).toBeVisible();

    await row.click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByText('Wow, the colors are amazing! Is this for the new dashboard?'),
    ).toBeVisible();
  });

  test('highlights the matched query in result rows', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    await dialog.locator('input').fill('colors');

    const row = dialog.getByRole('button', { name: 'Alice Freeman' });
    await expect(row).toBeVisible();
    await expect(row.locator('mark')).toHaveText('colors');
  });

  test('shows no-results state for unknown query', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    await dialog.locator('input').fill('zzzqqqxyz');

    await expect(dialog.getByText('Nothing found')).toBeVisible();
    await expect(dialog.getByText('Chats', { exact: true })).toHaveCount(0);
  });

  test('keyboard navigation opens the highlighted result', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    const input = dialog.locator('input');
    await input.fill('alice');

    // First flat row is the Alice Freeman chat
    await input.press('ArrowDown');
    await input.press('Enter');

    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByText('Wow, the colors are amazing! Is this for the new dashboard?'),
    ).toBeVisible();
  });

  test('group search finds groups by name and by member name, opens the group', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    const input = dialog.locator('input');
    const row = dialog.getByRole('button', { name: 'Design Team' });

    // Group name match: group appears in the Groups section
    await input.fill('design');
    await expect(dialog.getByText('Groups', { exact: true })).toBeVisible();
    // Listed once — under Groups, not duplicated under Chats
    await expect(row).toHaveCount(1);

    // Member name match: the group is still found
    await input.fill('Bob Smith');
    await expect(dialog.getByText('Groups', { exact: true })).toBeVisible();
    await expect(row).toBeVisible();

    // Selecting the group opens the group chat
    await row.click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByLabel('Main content').getByText("Bob: Let's review the new components later."),
    ).toBeVisible();
  });

  test('file search finds a file by name and opens the chat at that message', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    const input = dialog.locator('input');
    await input.fill('mockup');

    await expect(dialog.getByText('dashboard-mockup.pdf')).toBeVisible();

    await dialog.getByRole('button', { name: 'dashboard-mockup.pdf' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('dashboard-mockup.pdf').first()).toBeVisible();
  });

  test('date filter narrows file results to the selected range', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    const input = dialog.locator('input');
    await input.fill('pdf');

    await expect(dialog.getByText('dashboard-mockup.pdf')).toBeVisible();
    await expect(dialog.getByText('old-scan.pdf')).toBeVisible();

    await dialog.getByRole('button', { name: 'Last 7 days' }).click();

    await expect(dialog.getByText('old-scan.pdf')).toHaveCount(0);
    await expect(dialog.getByText('dashboard-mockup.pdf')).toBeVisible();
  });

  test('sender filter narrows file results to the selected sender', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    const input = dialog.locator('input');
    await input.fill('pdf');

    await expect(dialog.getByText('dashboard-mockup.pdf')).toBeVisible();
    await expect(dialog.getByText('old-scan.pdf')).toBeVisible();

    // All mock file messages are sent by the other person
    await dialog.getByRole('button', { name: 'Me', exact: true }).click();
    await expect(dialog.getByText('Nothing found')).toBeVisible();

    await dialog.getByRole('button', { name: 'Others' }).click();
    await expect(dialog.getByText('dashboard-mockup.pdf')).toBeVisible();
    await expect(dialog.getByText('old-scan.pdf')).toBeVisible();
  });

  test('type filter scopes results to the selected content type', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    const input = dialog.locator('input');
    await input.fill('pdf');

    await expect(dialog.getByText('dashboard-mockup.pdf')).toBeVisible();
    await expect(dialog.getByText('old-scan.pdf')).toBeVisible();

    // Files type keeps the file rows
    await dialog.getByRole('button', { name: 'Files' }).click();
    await expect(dialog.getByText('dashboard-mockup.pdf')).toBeVisible();
    await expect(dialog.getByText('old-scan.pdf')).toBeVisible();

    // Media type hides file rows
    await dialog.getByRole('button', { name: 'Media' }).click();
    await expect(dialog.getByText('Nothing found')).toBeVisible();
  });

  test('link search finds a URL and opens the chat at that message', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    await dialog.locator('input').fill('neumorphic-forms-tips');

    const linkRow = dialog.getByText('https://example.com/neumorphic-forms-tips', { exact: true });
    await expect(linkRow).toBeVisible();

    await linkRow.click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByText('https://example.com/neumorphic-forms-tips', { exact: true }).first(),
    ).toBeVisible();
  });

  test('search history persists across reopens and can be cleared', async ({ page }) => {
    const dialog = await openGlobalSearch(page);
    await dialog.locator('input').fill('neural');

    // Channel result with matched-message snippet
    const row = dialog.getByRole('button', { name: 'Tech Insights' });
    await expect(row).toBeVisible();
    await row.click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('New update on the neural engines.')).toBeVisible();

    // Reopen: history committed on selection is listed
    const reopened = await openGlobalSearch(page);
    await expect(reopened.getByText('Recent searches')).toBeVisible();
    const historyRow = reopened.getByRole('button', { name: 'neural', exact: true });
    await expect(historyRow).toBeVisible();

    // Clicking a history row re-runs the query
    await historyRow.click();
    await expect(reopened.getByRole('button', { name: 'Tech Insights' })).toBeVisible();

    // Clear history
    await page.keyboard.press('Escape');
    const reopenedAgain = await openGlobalSearch(page);
    await reopenedAgain.getByRole('button', { name: 'Clear history' }).click();
    await expect(reopenedAgain.getByText('Recent searches')).toHaveCount(0);
  });
});
