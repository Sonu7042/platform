import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 60000,
  use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173', headless: true, channel: 'chrome', trace: 'retain-on-failure' },
});
