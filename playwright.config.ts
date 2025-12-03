import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for my2light E2E Tests
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests/e2e',

    /* Run tests sequentially for video tests */
    fullyParallel: false,

    /* Fail the build on CI if you accidentally left test.only */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Single worker to avoid conflicts with camera access */
    workers: 1,

    /* Reporter to use */
    reporter: [
        ['html'],
        ['list'],
        ['json', { outputFile: 'test-results/results.json' }]
    ],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL */
        baseURL: 'http://localhost:5173',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'retain-on-failure',

        /* Timeout for each action */
        actionTimeout: 10000,

        /* Navigation timeout */
        navigationTimeout: 30000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Grant camera permissions by default
                permissions: ['camera', 'microphone'],
                launchOptions: {
                    args: [
                        '--use-fake-ui-for-media-stream',
                        '--use-fake-device-for-media-stream',
                    ],
                },
            },
        },

        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                permissions: ['camera', 'microphone'],
            },
        },

        // {
        //   name: 'webkit',
        //   use: { 
        //     ...devices['Desktop Safari'],
        //     permissions: ['camera', 'microphone'],
        //   },
        // },

        /* Test against mobile viewports */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },

    /* Global timeout for all tests */
    timeout: 60000,

    /* Expect timeout */
    expect: {
        timeout: 10000,
    },
});
