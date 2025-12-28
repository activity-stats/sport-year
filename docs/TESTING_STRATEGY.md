# Testing Strategy

## Overview

This document outlines the testing strategy for Sport Year, explaining what tests belong where and how to maintain comprehensive test coverage across unit and E2E test suites.

## Test Pyramid

We follow the standard testing pyramid approach:

```
        /\
       /E2E\      ← 35 tests (User workflows)
      /------\
     /Integration\   ← ~20 tests (Component + Hook + API)
    /----------\
   / Unit Tests \  ← 73+ tests (Pure logic)
  /--------------\
```

### Principles

1. **Many fast unit tests** - Test business logic and utilities in isolation
2. **Some integration tests** - Test component + hook + API interactions
3. **Few slow E2E tests** - Test critical user workflows end-to-end

## Unit Tests vs E2E Tests

### Should They Test the Same Things?

**NO** - They serve fundamentally different purposes:

| **Aspect**            | **Unit Tests (Vitest)**               | **E2E Tests (Playwright)**            |
| --------------------- | ------------------------------------- | ------------------------------------- |
| **Purpose**           | Verify logic correctness in isolation | Verify user workflows and integration |
| **Speed**             | Fast (milliseconds)                   | Slow (seconds)                        |
| **Scope**             | Single function/component             | Full application stack                |
| **Mocking**           | Heavy mocking of dependencies         | Minimal mocking (real APIs)           |
| **When to run**       | Every save (watch mode)               | Before commit/deploy                  |
| **Failures indicate** | Logic bug                             | Integration or UX issue               |

### Decision Matrix

| **Test Scenario**                      | **Type** | **Reasoning**                     |
| -------------------------------------- | -------- | --------------------------------- |
| `formatDistance(5000) returns '5,00'`  | **Unit** | Pure function, no dependencies    |
| User sees distance formatted on card   | **E2E**  | Integration of multiple layers    |
| `aggregateYearStats` calculates totals | **Unit** | Pure logic, fast, many edge cases |
| Year-in-review displays correct stats  | **E2E**  | Full workflow validation          |
| Triathlon detection logic              | **Unit** | Business rule, many scenarios     |
| Triathlon section visibility in UI     | **E2E**  | User-facing feature               |
| OAuth token refresh                    | **Unit** | API client method                 |
| Complete Strava login flow             | **E2E**  | Multi-step user journey           |
| Chart renders with mock data           | **Unit** | Component in isolation            |
| Clicking heatmap navigates correctly   | **E2E**  | User interaction + navigation     |

## Current Test Coverage

### Unit Tests (73+ tests in 18 files)

**✅ Well Covered:**

- **Utils:**
  - `formatters.test.ts` - Distance, duration, pace, elevation formatting
  - `aggregations.test.ts` - Year stats calculation, monthly/type aggregation
  - `transformers.test.ts` - Strava API → Domain model transformation
  - `activityFilters.test.ts` - Distance, type, date filtering
  - `logger.test.ts` - Logging utilities
  - `toast.test.ts` - Toast notification helpers

- **Stores:**
  - `settingsStore.test.ts` - User settings persistence
  - `stravaConfigStore.test.ts` - Strava API configuration
  - `loadingStore.test.ts` - Loading state management

- **Services:**
  - `stravaConfigProvider.test.ts` - Config provider strategy pattern

- **API:**
  - `strava/client.test.ts` - Strava API client, auth, pagination

- **Hooks:**
  - `useActivities.test.ts` - Activity fetching with React Query

- **Components:**
  - `ErrorBoundary.test.tsx` - Error handling
  - `SetupWizard.test.tsx` - Initial setup flow
  - `StravaSettings.test.tsx` - Settings dialog
  - `StatsSelector.test.tsx` - Stats display selector
  - `LoadingProgress.test.tsx` - Loading indicators

### E2E Tests (35 tests in 6 files)

**✅ Comprehensive Coverage:**

- **auth.spec.ts** (5 tests)
  - Unauthenticated user flow
  - OAuth authorization
  - Successful authentication
  - Logout flow
  - Error handling

- **dashboard.spec.ts** (8 tests)
  - Dashboard loading
  - Activity display
  - Navigation
  - View switching

- **settings.spec.ts** (5 tests)
  - Open settings dialog
  - Exclude activity types
  - Configure distance filters
  - Save settings
  - Settings persistence across reload

- **year-in-review.spec.ts** (7 tests)
  - Year-in-review display
  - Statistics summary
  - Activity type breakdown
  - Monthly breakdown
  - Customize settings
  - Export functionality

- **year-in-review-customization.spec.ts** (6 tests)
  - Triathlon section visibility
  - Activity type filtering
  - Customize dialog interactions
  - Highlight filters
  - Heatmap navigation

- **user-preferences.spec.ts** (4 tests)
  - Language switching
  - Language persistence
  - Dark/light mode toggle
  - Theme persistence

## Gaps & Recommendations

### High Priority - Missing Unit Tests

#### 1. Sport Highlights Logic

**File:** `src/utils/__tests__/sportHighlights.test.ts`

**What to test:**

```typescript
describe('sportHighlights', () => {
  it('should detect marathon distance (42.195 km)');
  it('should detect half marathon distance (21.0975 km)');
  it('should find longest activity by distance');
  it('should find highest elevation gain activity');
  it('should calculate fastest pace for activity type');
  it('should identify personal records');
  it('should handle edge cases (no activities, zero values)');
});
```

**Why critical:** Core business logic for year-in-review highlights

---

#### 2. Triathlon Detection Logic

**File:** `src/utils/__tests__/triathlonDetection.test.ts`

**What to test:**

```typescript
describe('triathlonDetection', () => {
  it('should detect Triathlon activity type');
  it('should identify multisport activities');
  it('should detect Swim + Bike + Run combination patterns');
  it('should calculate combined triathlon stats');
  it('should handle incomplete triathlon data');
});
```

**Why critical:** Required for triathlon section feature (currently only E2E tested)

---

#### 3. Race Detection

**File:** `src/utils/__tests__/raceDetection.test.ts`

**What to test:**

```typescript
describe('raceDetection', () => {
  it('should detect 5K races (±100m tolerance)');
  it('should detect 10K races');
  it('should detect marathon races');
  it('should detect common cycling distances (100km, 200km)');
  it('should use workout_type flag when available');
  it('should handle imperial vs metric distances');
});
```

**Why critical:** Enhances year-in-review insights

---

### Medium Priority - Component Tests

#### 4. Chart Components

**File:** `src/components/charts/__tests__/MonthlyChart.test.tsx`

**What to test:**

```typescript
describe('MonthlyChart', () => {
  it('should render chart with monthly data');
  it('should display correct axis labels');
  it('should show tooltips on hover');
  it('should handle empty data gracefully');
  it('should respond to window resize');
});
```

---

#### 5. Activity Card Component

**File:** `src/components/activities/__tests__/ActivityCard.test.tsx`

**What to test:**

```typescript
describe('ActivityCard', () => {
  it('should display activity name and type');
  it('should format distance correctly');
  it('should show elevation gain');
  it('should display kudos count');
  it('should handle click events');
  it('should render activity map when available');
});
```

---

### Lower Priority - E2E Enhancements

#### 6. PDF Export

**File:** `e2e/pdf-export.spec.ts`

**What to test:**

```typescript
describe('PDF Export', () => {
  it('should export year in review as PDF');
  it('should include all visible cards in export');
  it('should handle export errors gracefully');
  it('should show download progress');
});
```

---

#### 7. Data Synchronization

**File:** `e2e/data-sync.spec.ts`

**What to test:**

```typescript
describe('Data Sync', () => {
  it('should incrementally sync new activities');
  it('should handle rate limit errors gracefully');
  it('should display sync progress');
  it('should update UI after successful sync');
  it('should cache synced data locally');
});
```

---

#### 8. Responsive Design

**File:** `e2e/responsive.spec.ts`

**What to test:**

```typescript
describe('Responsive Design', () => {
  it('should display mobile layout on small screens');
  it('should show hamburger menu on mobile');
  it('should hide sidebar on mobile');
  it('should display touch-friendly controls');
});
```

---

#### 9. Accessibility

**File:** `e2e/accessibility.spec.ts`

**What to test:**

```typescript
describe('Accessibility', () => {
  it('should navigate with keyboard only');
  it('should announce updates to screen readers');
  it('should have proper ARIA labels');
  it('should maintain focus management');
  it('should support high contrast mode');
});
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run tests for specific file
npm test -- formatters.test.ts

# Run tests in UI mode
npm run test:ui
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests (all browsers)
npm run test:e2e

# Run on single browser
npm run test:e2e -- --project=chromium

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# Run in UI mode
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- auth.spec.ts
```

### CI/CD Integration

```bash
# Run all quality checks (used in CI)
npm run validate

# This runs:
# 1. i18n:check - Check translation completeness
# 2. type-check - TypeScript compilation
# 3. lint - ESLint checks
# 4. format:check - Prettier formatting
# 5. test -- --run - All unit tests
```

## Coverage Goals

### Current Coverage (Unit Tests)

- **Statements:** 89.78%
- **Branches:** 77.55%
- **Functions:** 93.98%
- **Lines:** 89.54%

### Target Coverage

- **Statements:** ≥90%
- **Branches:** ≥80%
- **Functions:** ≥95%
- **Lines:** ≥90%

### Coverage Exclusions

The following are intentionally excluded from coverage:

- `node_modules/`
- `src/test/` - Test utilities
- `**/*.d.ts` - Type definitions
- `**/*.config.*` - Configuration files
- `**/mockData` - Mock data
- `dist/` - Build output
- `src/locales/*.json` - Translation files

## Best Practices

### Unit Tests

1. **Test pure functions thoroughly**
   - Many test cases
   - Edge cases (empty, zero, negative, null, undefined)
   - Boundary conditions

2. **Mock external dependencies**
   - Use `vi.mock()` for modules
   - Use `vi.fn()` for functions
   - Keep mocks simple and focused

3. **Use descriptive test names**
   - ✅ `should format distance < 10km with 2 decimals`
   - ❌ `test formatDistance`

4. **Test one thing per test**
   - Single assertion per test when possible
   - Clear failure messages

5. **Use factories for test data**
   ```typescript
   const createActivity = (overrides = {}) => ({
     id: '1',
     name: 'Test Activity',
     // ... defaults
     ...overrides,
   });
   ```

### E2E Tests

1. **Test user workflows, not implementation**
   - Focus on what users see and do
   - Avoid testing internal state

2. **Use reliable selectors**
   - ✅ `data-testid` attributes
   - ✅ Role-based selectors: `getByRole('button')`
   - ❌ CSS classes (brittle)

3. **Keep tests independent**
   - Each test should run in isolation
   - Use `beforeEach` for common setup

4. **Use mock data consistently**
   - Centralize mock data in `e2e/fixtures/`
   - Keep mock data realistic

5. **Handle timing properly**
   - Wait for elements: `await page.waitForSelector()`
   - Avoid hard-coded timeouts when possible
   - Use Playwright's auto-waiting features

## Continuous Improvement

### When to Add Tests

**Always add tests for:**

- New features
- Bug fixes (regression tests)
- Complex business logic
- User-facing workflows

**Test file naming:**

- Unit: `ComponentName.test.tsx` or `utilityName.test.ts`
- E2E: `feature-name.spec.ts`
- Place in `__tests__/` subdirectory for unit tests

### Monitoring Test Health

1. **Run tests frequently**
   - Unit tests in watch mode during development
   - E2E tests before commits

2. **Fix flaky tests immediately**
   - Flaky tests erode confidence
   - Investigate root causes

3. **Keep tests fast**
   - Unit tests: < 10ms per test
   - E2E tests: < 30s per test suite

4. **Review coverage regularly**
   - Run `npm run test:coverage`
   - Focus on uncovered critical paths

## Implementation Timeline

### Week 1 - High Priority Unit Tests

- [ ] sportHighlights.test.ts
- [ ] triathlonDetection.test.ts
- [ ] raceDetection.test.ts

### Week 2 - Component Tests

- [ ] MonthlyChart.test.tsx
- [ ] ActivityCard.test.tsx

### Week 3 - E2E Enhancements

- [ ] pdf-export.spec.ts
- [ ] data-sync.spec.ts

### Week 4 - Polish

- [ ] responsive.spec.ts
- [ ] accessibility.spec.ts
- [ ] Update documentation

## Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Internal Docs

- [Contributing Guidelines](../CONTRIBUTING.md)
- [I18N Testing](./I18N.md)
- [E2E Test README](../e2e/README.md)

### Test Utilities

- Test setup: `/src/test/setup.ts`
- Mock fixtures: `/e2e/fixtures/strava-mock.ts`
- Test data factories: Use in individual test files

---

**Last Updated:** December 28, 2025  
**Maintainer:** Development Team
