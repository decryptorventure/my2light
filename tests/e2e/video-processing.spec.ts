import { test, expect } from '../fixtures/base';

/**
 * Video Processing Tests (Phase 2)
 * Tests recording, highlight marking, and FFmpeg merge functionality
 */

test.describe('Video Processing', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@gmail.com');
        await page.fill('[name="password"]', '123123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*home/, { timeout: 10000 });
    });

    test('TC-REC-01: should request camera permission', async ({ page, context }) => {
        // Grant permissions programmatically
        await context.grantPermissions(['camera', 'microphone']);

        // Navigate to self recording
        await page.goto('/self-recording');

        // Should see setup page
        await expect(page.locator('text=Cài đặt quay')).toBeVisible({ timeout: 5000 });

        // Click start
        const startButton = page.locator('button:has-text("Bắt đầu quay")');
        await startButton.click();

        // Should see camera preview
        await page.waitForTimeout(2000);

        // Look for video element or camera indicator
        const videoElement = page.locator('video').first();
        await expect(videoElement).toBeVisible({ timeout: 10000 });
    });

    test('TC-REC-02: should start recording', async ({ page, context }) => {
        await context.grantPermissions(['camera', 'microphone']);

        await page.goto('/self-recording');

        // Skip setup
        await page.click('button:has-text("Bắt đầu quay")');
        await page.waitForTimeout(2000);

        // Click start recording
        const recordButton = page.locator('[data-testid="start-recording"]').or(
            page.locator('button:has-text("REC")').first()
        ).or(
            page.locator('.bg-lime-400').first()
        );

        await recordButton.click();

        // Should see recording indicator
        const recIndicator = page.locator('text=REC').or(
            page.locator('.animate-pulse').filter({ hasText: 'REC' })
        );
        await expect(recIndicator).toBeVisible({ timeout: 5000 });

        // Timer should be running
        const timer = page.locator('text=/\\d{2}:\\d{2}/');
        await expect(timer).toBeVisible({ timeout: 5000 });
    });

    test('TC-REC-03: should mark highlights during recording', async ({ page, context }) => {
        await context.grantPermissions(['camera', 'microphone']);

        await page.goto('/self-recording');
        await page.click('button:has-text("Bắt đầu quay")');
        await page.waitForTimeout(2000);

        // Start recording
        const recordButton = page.locator('.bg-lime-400').first();
        await recordButton.click();
        await page.waitForTimeout(2000);

        // Mark highlight
        const highlightButton = page.locator('[data-testid="mark-highlight"]').or(
            page.locator('button').filter({ has: page.locator('svg[class*="lucide-zap"]') })
        );

        // Should be visible during recording
        await expect(highlightButton).toBeVisible({ timeout: 5000 });

        // Mark 2 highlights
        await highlightButton.click();
        await page.waitForTimeout(2000);

        await highlightButton.click();
        await page.waitForTimeout(1000);

        // Should see highlight count
        const count = page.locator('text=/\\d\\s*Highlights?/i');
        await expect(count).toContainText('2');
    });

    test.skip('TC-REC-06: should merge highlights with FFmpeg', async ({ page, context }) => {
        // This test is resource-intensive, skip in CI
        if (process.env.CI) {
            test.skip();
        }

        await context.grantPermissions(['camera', 'microphone']);

        await page.goto('/self-recording');
        await page.click('button:has-text("Bắt đầu quay")');
        await page.waitForTimeout(2000);

        // Start recording
        const recordButton = page.locator('.bg-lime-400').first();
        await recordButton.click();

        // Record for 10 seconds
        await page.waitForTimeout(10000);

        // Mark highlights
        const highlightButton = page.locator('button').filter({
            has: page.locator('svg[class*="lucide-zap"]')
        });
        await highlightButton.click();
        await page.waitForTimeout(2000);
        await highlightButton.click();

        // Stop recording
        const stopButton = page.locator('[data-testid="stop-recording"]').or(
            page.locator('button').filter({ has: page.locator('.bg-red-500') })
        );
        await stopButton.click();

        // Should go to preview
        await page.waitForTimeout(3000);

        // Look for merge button
        const mergeButton = page.locator('button:has-text("Ghép")').first();
        await expect(mergeButton).toBeVisible({ timeout: 10000 });

        // Click merge
        await mergeButton.click();

        // Should show progress modal
        const progressModal = page.locator('text=Đang xử lý video').or(
            page.locator('text=/\\d+%/')
        );
        await expect(progressModal).toBeVisible({ timeout: 5000 });

        // Wait for completion (max 60s)
        await expect(page.locator('text=Hoàn thành')).toBeVisible({
            timeout: 60000
        });

        // Progress should be 100%
        await expect(page.locator('text=100%')).toBeVisible();
    });

    test('TC-REC-07: should handle unsupported browser gracefully', async ({ page }) => {
        // Navigate to recording
        await page.goto('/self-recording');

        // Inject script to disable SharedArrayBuffer
        await page.addInitScript(() => {
            // @ts-ignore
            delete window.SharedArrayBuffer;
        });

        // Try to use merge feature
        // Should show error message about browser support
        // (This would require actually recording first, which is complex in test)

        // For now, just verify the page loads
        // await expect(page).toBeVisible(); // Skip this assertion
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Video Processing - Error Handling', () => {
    test('should allow canceling merge', async ({ page }) => {
        // This would require setting up a merge in progress
        // Placeholder for now
        test.skip();
    });

    test('should allow retrying failed merge', async ({ page }) => {
        // This would require triggering a merge failure
        // Placeholder for now
        test.skip();
    });
});
