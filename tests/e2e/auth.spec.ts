import { test, expect } from '../fixtures/base';

/**
 * Authentication Flow Tests
 * Tests login, logout, and profile management
 */

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('TC-AUTH-02: should login successfully with valid credentials', async ({ page }) => {
        // Navigate to login
        await page.goto('/login');

        // Fill credentials
        await page.fill('[name="email"]', 'admin@gmail.com');
        await page.fill('[name="password"]', '123123');

        // Submit
        await page.click('button[type="submit"]');

        // Should redirect to home
        await page.waitForURL(/.*home/, { timeout: 10000 });
        await expect(page).toHaveURL(/.*home/);

        // Should see user interface
        const userElement = page.locator('[data-testid="user-name"]').or(page.locator('text=Nguyễn'));
        await expect(userElement).toBeVisible({ timeout: 5000 });
    });

    test('TC-AUTH-03: should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');

        // Fill wrong credentials
        await page.fill('[name="email"]', 'wrong@test.com');
        await page.fill('[name="password"]', 'wrongpassword');

        // Submit
        await page.click('button[type="submit"]');

        // Should stay on login page
        await expect(page).toHaveURL(/.*login/);

        // Should see error (toast or error message)
        const errorElement = page.locator('.toast').or(
            page.locator('text=thất bại')
        ).or(
            page.locator('[data-testid="error-message"]')
        );
        await expect(errorElement).toBeVisible({ timeout: 5000 });
    });

    test('TC-AUTH-05: should logout successfully', async ({ authenticatedPage: page }) => {
        // Should be on home page
        await expect(page).toHaveURL(/.*home/);

        // Find and click logout button
        const logoutButton = page.locator('[data-testid="logout-button"]').or(
            page.locator('button:has-text("Đăng xuất")')
        ).or(
            page.locator('text=Đăng xuất')
        );

        await logoutButton.click();

        // Should redirect to login
        await page.waitForURL(/.*login/, { timeout: 10000 });
        await expect(page).toHaveURL(/.*login/);
    });

    test('TC-AUTH-04: should update profile', async ({ authenticatedPage: page }) => {
        // Navigate to profile
        await page.goto('/profile');

        // Update name
        const nameInput = page.locator('[name="name"]').or(
            page.locator('input[placeholder*="Tên"]')
        );
        await nameInput.fill('Updated Name');

        // Save
        const saveButton = page.locator('button:has-text("Lưu")').or(
            page.locator('button[type="submit"]')
        );
        await saveButton.click();

        // Should see success message
        const successToast = page.locator('.toast-success').or(
            page.locator('text=thành công')
        );
        await expect(successToast).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Protected Routes', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
        // Try to access protected route
        await page.goto('/my-bookings');

        // Should redirect to login
        await page.waitForURL(/.*login/, { timeout: 10000 });
        await expect(page).toHaveURL(/.*login/);
    });
});
