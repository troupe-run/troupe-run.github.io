import { defineConfig, devices } from '@playwright/test';
import { e2ePort, previewCommand } from './tests/e2e/port';

// Its own port, free when the run starts: never the dev (4321) server or another worktree's run, so a test can't
// silently run against a stale server. E2E_PORT chooses one.
const PORT = e2ePort();

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${PORT}`, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: previewCommand(PORT),
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
