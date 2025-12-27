# AI Agent Instructions

This document provides context and guidelines for AI assistants working on the Sport Year codebase.

## 📋 Project Overview

**Sport Year** is a React + TypeScript web application for visualizing Strava athletic activities and creating year-in-review summaries.

**Key Features:**

- Strava OAuth authentication
- Activity data fetching and visualization
- Year-in-review generator with customization
- Image export for social sharing
- Privacy-first (local storage only)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS 4
- **State**: Zustand (stores)
- **Data**: TanStack Query (React Query)
- **Routing**: React Router 7
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library

### Project Structure

```
src/
├── api/strava/          # Strava API client
├── components/          # React components
│   ├── activities/      # Activity list components
│   ├── charts/          # Chart components
│   ├── settings/        # Settings modal
│   ├── setup/           # Setup wizard
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── pages/               # Page components (Login, Dashboard, Callback)
├── services/            # Business logic (config providers)
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
└── utils/               # Utility functions

Key files:
- services/stravaConfigProvider.ts - SOLID config loading
- stores/stravaConfigStore.ts - Config state management
- stores/authStore.ts - Authentication state
- api/strava/client.ts - Strava API integration
```

## 🎯 Design Principles

### SOLID Architecture

The codebase follows SOLID principles to maintain clean, maintainable code:

#### Single Responsibility Principle (SRP)

- Each module has one reason to change
- Example: `stravaConfigProvider.ts` handles config loading only
- Separate stores for auth, settings, config
- Utility functions do one thing well

#### Open/Closed Principle (OCP)

- Open for extension, closed for modification
- Example: `IConfigProvider` interface allows new providers without changing existing code
- `CompositeConfigProvider` adds fallback behavior through composition

#### Liskov Substitution Principle (LSP)

- All `IConfigProvider` implementations are interchangeable
- Hooks can be swapped without breaking components
- Store interfaces remain consistent

#### Interface Segregation Principle (ISP)

- Focused interfaces: `IConfigProvider` has minimal methods
- Stores expose only needed methods
- Components receive only props they use

#### Dependency Inversion Principle (DIP)

- Depend on abstractions (interfaces), not concretions
- `stravaConfigStore` depends on `IConfigProvider` interface
- `ConfigProviderFactory` creates concrete implementations
- Easy to mock for testing

**Config System Example:**

```typescript
IConfigProvider (interface)
├── EnvConfigProvider (env vars)
├── StorageConfigProvider (localStorage)
└── CompositeConfigProvider (fallback chain)

// Factory creates providers
ConfigProviderFactory.create() → IConfigProvider
```

### Code Quality Standards

- **TypeScript**: Strict mode, minimal `any` usage
- **Testing**: 100% coverage on critical paths (73 tests total)
- **Formatting**: Prettier with single quotes, 100 char width
- **Linting**: ESLint with TypeScript + React rules
- **Security**: Actions locked to SHA, minimal permissions

## 🔑 Key Concepts

### Authentication Flow

1. User creates Strava API app (OAuth client)
2. User enters Client ID + Secret in setup wizard
3. App stores credentials in localStorage
4. OAuth-Driven Development (TDD) Approach

**Always write tests when implementing features:**

1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write minimum code to make the test pass
3. **Refactor**: Improve code while keeping tests green

**Example TDD workflow:**

```typescript
// 1. RED - Write failing test
it('should calculate total distance', () => {
  const activities = [{ distance: 1000 }, { distance: 2000 }];
  expect(calculateTotalDistance(activities)).toBe(3000);
});

// 2. GREEN - Implement minimum code
function calculateTotalDistance(activities) {
  return activities.reduce((sum, a) => sum + a.distance, 0);
}

// 3. REFACTOR - Improve while tests stay green
function calculateTotalDistance(activities: Activity[]): number {
  return activities.reduce((sum, a) => sum + (a.distance || 0), 0);
}
```

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup: Reset mocks, clear stores
    vi.clearAllMocks();
  });

  describe('Feature: User Authentication', () => {
    it('should display login button when not authenticated', () => {
      // Arrange
      const { getByRole } = render(<Component />);

      // Act
      const button = getByRole('button', { name: /login/i });

      // Assert
      expect(button).toBeInTheDocument();
    });

    it('should redirect after successful login', async () => {
      // Arrange, Act, Assert with async
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});
```

### Testing Patterns

#### Component Testing

- Use React Testing Library (`render`, `screen`, `userEvent`)
- Test user interactions, not implementation details
- Query by accessible roles: `getByRole`, `getByLabelText`
- Avoid querying by class names or test IDs when possible

#### Store Testing

- Mock stores with `vi.mock()`
- Test state changes and side effects
- Verify localStorage persistence

```typescript
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: true,
    logout: vi.fn(),
  })),
}));
```

###🏛️ Architectural Guidelines

### Caching Strategy

**TanStack Query (React Query)** provides intelligent caching:

```typescript
useQuery({
  queryKey: ['activities', year],
  queryFn: () => fetchActivities(year),
  staleTime: 1000 * 60 * 60, // 1 hour - data stays fresh
  gcTime: 1000 * 60 * 60 * 24, // 24 hours - cache retention
  refetchOnWindowFocus: false, // Don't refetch on tab focus
});
```

**Incremental Data Fetching:**

- Store last activity timestamp per year
- Fetch only new activities since last sync
- 1-day buffer for activity updates
- Merge and deduplicate on client side

**localStorage Persistence:**

- Auth tokens (authStore)
- Settings (settingsStore)
- Last sync times (dataSyncStore)
- Language preference (languageStore)

**Cache invalidation:**

- Manual refresh via UI button
- Automatic refresh after 1 hour stale time
- Token expiry triggers re-auth

### Rate Limit Respect

**Strava API Limits:**

- 100 requests per 15 minutes
- 1,000 requests per day

**Implementation:**

```typescript
// api/strava/client.ts
interceptors.response.use((response) => {
  const rateLimit = response.headers['x-ratelimit-limit'];
  const rateUsage = response.headers['x-ratelimit-usage'];
  console.log(`Rate Limit: ${rateUsage}/${rateLimit}`);
  return response;
});
```

**Best practices:**

- Use pagination (max 200 items per request)
- Implement incremental fetching
- Cache aggressively (1 hour stale time)
- Batch operations when possible
- Handle 429 errors gracefully

**Typical usage:**

- Initial load: 1-5 requests (depending on activity count)
- Subsequent visits: 0-2 requests (cache hit + incremental)
- Page reload < 1 hour: 0 requests (cache)

### Internationalization (i18n)

**Language Support:**

- English (en) - Default
- Nederlands (nl) - Dutch

**Implementation:**

```typescript
// In components
const { t } = useTranslation();
<h1>{t('app.title')}</h1>

// With variables
t('yearInReview.closingMessageYear', { year: 2024 })

// In stores
const { language, setLanguage } = useLanguageStore();
```

**File structure:**

```
src/locales/
├── en.json    # English translations
└── nl.json    # Dutch translations
```

**Adding translations:**

1. Never hardcode user-facing text
2. Add keys to both locale files
3. Use dot notation: `namespace.key`
4. Test in all languages
5. Consider string length variations

**Language detection:**

- Browser language auto-detected
- User preference persisted in localStorage
- Switcher in sidebar (desktop) and more menu (mobile)

See [docs/I18N.md](docs/I18N.md) for complete i18n guide.

### Desktop & Mobile Support

**Responsive Design Strategy:**

**Breakpoints (Tailwind):**

```
sm:  640px   - Small tablets
md:  768px   - Tablets, sidebar appears
lg:  1024px  - Desktop
xl:  1280px  - Large desktop
```

**Mobile-first approach:**

```tsx
// Base: mobile styles
className = 'px-3 py-2';

// Add desktop styles
className = 'px-3 py-2 md:px-6 md:py-4';
```

**Navigation:**

- **Desktop (md+)**: Left sidebar with hover expand
- **Mobile**: Bottom navigation bar + drawer menu

**Layout patterns:**

```tsx
{
  /* Hide on mobile, show on desktop */
}
className = 'hidden md:block';

{
  /* Show on mobile, hide on desktop */
}
className = 'block md:hidden';

{
  /* Responsive grid */
}
className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
```

**Touch vs Click:**

- Use adequate touch targets (min 44x44px)
- Hover states for desktop only
- Swipe gestures considered for mobile

**Performance:**

- Lazy load images
- Code splitting for routes
- Smaller images on mobile
- Conditional rendering based on screen size

### State Management Patterns

**Zustand Stores:**

```typescript
// Persist to localStorage
create()(
  persist(
    (set) => ({
      /* state */
    }),
    { name: 'store-name' }
  )
);

// No persistence
create()((set) => ({
  /* state */
}));
```

**Store organization:**

- `authStore` - Authentication state
- `settingsStore` - UI preferences, filters
- `stravaConfigStore` - API credentials
- `dataSyncStore` - Sync metadata
- `loadingStore` - Loading states
- `themeStore` - Theme preferences
- `languageStore` - Language selection

**Best practices:**

- Keep stores focused (SRP)
- Use TypeScript interfaces
- Export typed hooks
- Test store behavior in isolation

### Error Handling

**API errors:**

```typescript
try {
  const data = await api.fetchData();
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded
  } else if (error.response?.status === 401) {
    // Token expired - trigger refresh
  } else {
    // Generic error handling
  }
}
```

**User feedback:**

- Loading states (LoadingProgress component)
- Error messages in UI
- Toast notifications for actions
- Fallback UI for errors

## 🔒 Security Considerations

### Never Commit

- API keys or secrets
- `.env` files (use `.env.example` templates)
- Tokens or credentials
- User data or PII
- Strava Client Secret

### Always

- Validate user input
- Sanitize data before display
- Use TypeScript for type safety
- Keep dependencies updated (`npm audit`)
- Review `dependabot` PRs promptly
- Use HTTPS for all API requests

### Strava API Security

- OAuth 2.0 flow only
- Tokens stored in localStorage (not cookies)
- Client Secret never exposed in frontend
- HTTPS for all Strava API requests
- Handle 401/403 properly (re-auth)
- Respect rate limits (prevent abuse)

### Data Privacy

- No data sent to external servers (except Strava API)
- All processing happens client-side
- localStorage only - no cookies
- No analytics or tracking
- User controls their data completely

### CI/CD Pipeline Security

**GitHub Actions Security Best Practices:**

**1. Action Version Pinning (SHA Locking)**

```yaml
# ✅ GOOD - Pinned to specific SHA with version comment
uses: actions/checkout@eef61447b9ff4aafe5dcd4e0bbf5d482be7e7871 # v4.2.1

# ❌ BAD - Floating tag (can be hijacked)
uses: actions/checkout@v4
```

**Why pin to SHA:**

- Prevents supply chain attacks
- Tag references can be moved to malicious code
- SHA is immutable - guarantees exact code version
- Comment shows human-readable version

**Current pinned actions:**

- `actions/checkout@eef61447...` (v4.2.1)
- `actions/setup-node@0a44ba78...` (v4.0.4)
- `actions/upload-artifact@b4b15b8c...` (v4.4.3)
- `codecov/codecov-action@b9fd7d16...` (v4.6.0)

**2. Minimal Permissions (Principle of Least Privilege)**

```yaml
# Workflow level - default to minimal
permissions:
  contents: read # Only read access

# Job level - grant only what's needed
jobs:
  build:
    permissions:
      contents: read # No write access unless required
```

**Never grant:**

- `write` permissions unless absolutely necessary
- `permissions: write-all` (dangerous)
- Unnecessary scopes

**3. Secret Management**

```yaml
# Use GitHub Secrets, never hardcode
token: ${{ secrets.CODECOV_TOKEN }}

# Disable credential persistence
with:
  persist-credentials: false
```

**4. Dependency Installation Security**

```yaml
# Use npm ci (clean install) not npm install
run: npm ci --ignore-scripts

# --ignore-scripts prevents malicious postinstall scripts
```

**5. Concurrency Control**

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true # Save resources, prevent duplicate runs
```

### Dependency Management & Version Pinning

**package.json Strategy:**

```json
{
  "dependencies": {
    "react": "^19.2.0", // Allow patch updates
    "axios": "^1.13.2" // Minor updates acceptable
  },
  "devDependencies": {
    "vite": "^7.2.4" // Caret allows minor updates
  }
}
```

**Version Ranges:**

- `^X.Y.Z` - Allow minor and patch updates (recommended)
- `~X.Y.Z` - Allow only patch updates (stricter)
- `X.Y.Z` - Exact version (too strict, miss security patches)

**package-lock.json:**

- **Always committed** - ensures reproducible builds
- Locks transitive dependencies to exact versions
- `npm ci` respects lockfile exactly
- Update with `npm update` when needed

**Security Workflow:**

1. **Automated Security Scanning:**
   - CodeQL (`.github/workflows/codeql.yml`)
   - Dependency Review (`.github/workflows/dependency-review.yml`)
   - npm audit in CI pipeline

2. **Dependabot:**
   - Automatically creates PRs for updates
   - Includes security patches
   - Review and merge promptly

3. **Manual Audits:**

```bash
npm audit                    # Check for vulnerabilities
npm audit fix               # Auto-fix compatible issues
npm audit fix --force       # Force fix (may break things)
npm outdated               # Check for updates
```

4. **Before Merging:**
   - [ ] Review dependency changes
   - [ ] Check for breaking changes in changelogs
   - [ ] Run full test suite
   - [ ] Verify build still works
   - [ ] Check bundle size impact

**Security Levels:**

- `low` - Monitor
- `moderate` - Fix in next release
- `high` - Fix immediately
- `critical` - Emergency patch

### Security Checklist for PRs

When reviewing or creating PRs:

- [ ] No secrets, API keys, or tokens in code
- [ ] All actions pinned to SHA (not tags)
- [ ] Minimal permissions in workflows
- [ ] `npm audit` passes (moderate+)
- [ ] No suspicious dependency additions
- [ ] User input validated and sanitized
- [ ] HTTPS for all external requests
- [ ] TypeScript strict mode enforced
- [ ] Tests cover security-critical paths
- [ ] No console.log with sensitive data
- **Critical paths**: 100% (auth, config, data fetching)
- **Overall target**: 80%+ statements
- **Run coverage**: `npm run test:coverage`
- Coverage report in `coverage/` directory

### When to Write Tests

**Always:**

- New components and hooks
- Business logic and utilities
- Store state management
- API integration code
- Bug fixes (regression tests)

**Test file naming:**

- Place in `__tests__/` subdirectory
- Name: `ComponentName.test.tsx` or `utilityName.test.ts`

### Testing Checklist

- [ ] Positive cases (happy path)
- [ ] Negative cases (errors, edge cases)
- [ ] Loading states
- [ ] User interactions (clicks, input)
- [ ] Async operations
- [ ] Accessibility (screen reader labels)
- [ ] Responsive behavior (if applicable)> {
      beforeEach(() => {
      // Setup mocks
      });

  describe('feature group', () => {
  it('should do specific thing', () => {
  // Arrange, Act, Assert
  });
  });
  });

````

### Testing Patterns

- Use React Testing Library (`render`, `screen`, `userEvent`)
- Mock stores with `vi.mock()`
- Test user interactions, not implementation
- Mock `window.location` for URL tests
- Use `waitFor` for async operations

### Coverage Requirements

- Critical paths: 100%
- Overall: 80%+ statements
- Run: `npm run test:coverage`

## 🚀 Common Tasks

### Adding a New Component

1. Create in appropriate directory (e.g., `components/ui/`)
2. Add TypeScript interface for props
3. Write component with proper types
4. Add tests in `__tests__/` subdirectory
5. Export from `index.ts`

### Adding a New API Endpoint

1. Add method to `api/strava/client.ts`
2. Add types to `types/strava.ts`
3. Create custom hook in `hooks/` if needed
4. Add tests

### Adding a New Store

1. Create in `stores/` directory
2. Use Zustand with TypeScript
3. Add persist middleware if needed
4. Add tests in `__tests__/`

### Updating Styles

- Use Tailwind utility classes
- Follow existing color scheme (orange primary)
- Responsive design (mobile-first)
- Dark mode not implemented (future feature)

## 🔒 Security Considerations

### Never Commit

- API keys or secrets
- `.env` files
- Tokens or credentials
- User data

### Always

- Validate user input
- Sanitize data before display
- Use TypeScript for type safety
- Keep dependencies updated
- Run `npm audit`

### Strava API

- OAuth 2.0 only
- Tokens in localStorage (not cookies)
- HTTPS for all requests
- Respect rate limits
- Handle 401/403 errors

## 🛠️ Development Commands

### Testing

```bash
npm test                # Run tests in watch mode
npm test -- --run       # Run tests once (CI mode)
npm run test:coverage   # Run with coverage report
npm run test:ui         # Open Vitest UI for visual test debugging
````

**Test-Driven Development (TDD) Workflow:**

1. Write failing test first
2. Implement minimum code to pass
3. Refactor while keeping tests green
4. Repeat

### Linting & Formatting

```bash
npm run lint            # Check for linting errors (ESLint)
npm run lint:fix        # Auto-fix linting issues
npm run format          # Format code with Prettier
npm run format:check    # Check if code is formatted correctly
```

**Pre-commit**: Husky + lint-staged automatically runs on `git commit`

### Type Checking

```bash
npm run type-check      # TypeScript compilation check (no emit)
```

### Building

```bash
npm run build           # Production build (includes type-check)
npm run preview         # Preview production build locally
```

**Build output**: `dist/` directory with optimized assets

### Development Server

```bash
npm run dev             # Start dev server (http://localhost:5173)
```

**Hot Module Replacement (HMR)** enabled for instant updates

### Complete Validation

```bash
npm run validate        # Run all checks: type-check + lint + format + test
npm run ci:local        # Simulate CI pipeline locally
```

**Before pushing**: Always run `npm run validate` to catch issues early

## 📝 Code Patterns

### Component Pattern

```typescript
interface MyComponentProps {
  data: string;
  onAction: () => void;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  const [state, setState] = useState('');

  return (
    <div className="flex flex-col gap-4">
      {/* Content */}
    </div>
  );
}
```

### Custom Hook Pattern

```typescript
export const useMyHook = (param: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['key', param],
    queryFn: () => fetchData(param),
  });

  return { data, isLoading, error };
};
```

### Store Pattern

```typescript
interface MyStore {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      value: '',
      setValue: (value) => set({ value }),
    }),
    { name: 'my-store' }
  )
);
```

## 🐛 Common Issues

### Build Failures

- Check TypeScript errors: `npm run type-check`
- Check for unused imports
- Verify all dependencies installed

### Test Failures

- Mock window.location properly
- Use `waitFor` for async operations
- Clear mocks in `beforeEach`

### Linting Issues

- Auto-fix: `npm run lint:fix`
- Format: `npm run format`
- Check `.eslintrc` for rules

## 📚 Important Files to Know

### Configuration

- `vite.config.ts` - Vite build config
- `vitest.config.ts` - Test config
- `eslint.config.js` - Linting rules
- `.prettierrc` - Formatting rules
- `tsconfig.json` - TypeScript config

### CI/CD

- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/codeql.yml` - Security scanning
- `.github/workflows/dependency-review.yml` - Dependency checks

### Git

- `.husky/pre-commit` - Pre-commit hooks (runs lint-staged)
- `.gitignore` - Ignored files

## 🎓 Learning Resources

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vite.dev
- **Tailwind**: https://tailwindcss.com
- **Vitest**: https://vitest.dev
- **Strava API**: https://developers.strava.com

## 💡 Best Practices for AI Agents

### When Making Changes

1. **Read existing code first** - Understand patterns
2. **Maintain consistency** - Follow established patterns
3. **Run tests** - Always verify changes work
4. **Update tests** - Add/modify tests for changes
5. **Check types** - Ensure TypeScript compliance
6. **Format code** - Run Prettier before committing

### When Suggesting Solutions

1. **Consider existing architecture** - SOLID, provider pattern
2. **Type safety first** - Avoid `any`, use proper types
3. **Test coverage** - Include test examples
4. **Security awareness** - No secrets, validate inputs
5. **Performance** - Consider bundle size, lazy loading

### When Debugging

1. **Check CI logs** - GitHub Actions output
2. **Run locally** - `npm run validate`
3. **Review test output** - Error messages are helpful
4. **Check browser console** - Runtime errors
5. **Verify environment** - Node version, dependencies

## ✅ Quality Checklist

Before marking work complete:

- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Tests pass (`npm test -- --run`)
- [ ] Linting passes (`npm run lint`)
- [ ] Formatted correctly (`npm run format:check`)
- [ ] No console.log statements
- [ ] Documentation updated if needed
- [ ] Security considerations addressed
- [ ] Follows existing patterns

## 🤝 Collaboration

When working with humans:

- Ask clarifying questions when uncertain
- Explain architectural decisions
- Provide context for suggestions
- Reference specific files/lines
- Suggest incremental changes
- Respect existing patterns

---

For questions or clarifications, refer to:

- README.md - Project overview
- CONTRIBUTING.md - Contribution guidelines
- SECURITY.md - Security policies
- .github/workflows/README.md - CI/CD documentation
