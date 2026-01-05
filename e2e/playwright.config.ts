import { defineConfig, devices } from '@playwright/test';

/**
 * Operation Hired - E2E Test Configuration
 *
 * Comprehensive end-to-end testing for the deployed resume generation platform.
 * Tests full user journeys from intake to PDF download.
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: false, // Sequential for dependent tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for sequential flow
  reporter: [
    ['list'],
    ['html', { outputFolder: '../test-results/html-report' }],
    ['json', { outputFile: '../test-results/results.json' }]
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://resume-gen-intent-dev.web.app',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  // Global timeout for long-running AI operations
  timeout: 180000, // 3 minutes

  // Output directories
  outputDir: '../test-results/artifacts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
});
