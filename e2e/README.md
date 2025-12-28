# E2E Tests

Integration tests using Playwright with fully mocked Strava API.

## Setup

Install Playwright browsers:

```bash
npx playwright install
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run specific test
npx playwright test -g "should handle Strava OAuth flow"
```

## Test Structure

```
e2e/
├── fixtures/
│   └── strava-mock.ts      # Mocked Strava API responses
├── auth.spec.ts            # Authentication flow tests
├── dashboard.spec.ts       # Dashboard functionality tests
├── settings.spec.ts        # Settings management tests
└── year-in-review.spec.ts  # Year in review features tests
```

## Mock Data

All Strava API endpoints are mocked with realistic test data:

- **Athlete**: Test athlete with ID 12345678
- **Activities**: 5 sample activities (runs, rides, swim)
- **Stats**: Year-to-date and recent totals

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { setupStravaMocks, setupAuthState } from './fixtures/strava-mock';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await setupStravaMocks(page);
    await setupAuthState(page); // If auth is needed
  });

  test('should do something', async ({ page }) => {
    await page.goto('/dashboard');
    // Test assertions
  });
});
```

### Adding Mock Data

Edit `e2e/fixtures/strava-mock.ts`:

```typescript
export const mockStravaActivities = [
  {
    id: 10001,
    name: 'My Activity',
    type: 'Run',
    distance: 10000,
    // ... more fields
  },
];
```

### Custom Mocks

```typescript
await page.route('**/api/v3/custom-endpoint', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: 'custom' }),
  });
});
```

## Best Practices

1. **Use Page Object Pattern** for complex interactions
2. **Wait for elements** with `waitForSelector` or `waitForTimeout`
3. **Mock all external APIs** - tests should never hit real Strava
4. **Keep tests independent** - each test should work in isolation
5. **Use descriptive test names** - "should display athlete name" not "test1"

## Debugging

- Use `await page.pause()` to stop execution and inspect
- Run with `--headed` to see browser
- Check `test-results/` folder for screenshots and traces
- Use Playwright Inspector: `npm run test:e2e:debug`

## CI Integration

Tests can be added to CI by updating `.github/workflows/ci.yml`:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
```
