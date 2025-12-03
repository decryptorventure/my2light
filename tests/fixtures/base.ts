import { test as base, expect, Page } from '@playwright/test';

/**
 * Test fixtures for my2light
 * Provides reusable test setup and helpers
 */

// Test user data (using real account)
export const testUsers = {
    player1: {
        email: 'admin@gmail.com',
        password: '123123',
        name: 'Admin',
    },
    player2: {
        email: 'testplayer2@my2light.test',
        password: 'TestPass@123',
        name: 'Trần Test 2',
    },
};

// Extend base test with custom fixtures
type CustomFixtures = {
    authenticatedPage: Page;
    cleanupUser: () => Promise<void>;
};

export const test = base.extend<CustomFixtures>({
    // Authenticated page fixture
    authenticatedPage: async ({ page }, use) => {
        // Login before test
        await page.goto('/login');
        await page.fill('[name="email"]', testUsers.player1.email);
        await page.fill('[name="password"]', testUsers.player1.password);
        await page.click('button[type="submit"]');

        // Wait for redirect
        await page.waitForURL(/.*home/, { timeout: 10000 });

        await use(page);

        // Logout after test
        try {
            await page.click('[data-testid="logout-button"]', { timeout: 5000 });
        } catch (e) {
            // Ignore if already logged out
        }
    },

    // User cleanup fixture
    cleanupUser: async ({ }, use) => {
        await use(async () => {
            // Cleanup test users from database if needed
            // This runs after each test
        });
    },
});

export { expect };
