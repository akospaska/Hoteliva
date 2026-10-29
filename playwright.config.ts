import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:8081', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile-web', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'npm run test:browser-server -w @hoteliva/server',
      url: 'http://127.0.0.1:3001/health/ready',
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'npm run web -w @hoteliva/client -- --port 8081',
      url: 'http://localhost:8081',
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
