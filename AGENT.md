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
The codebase follows SOLID principles, particularly in the config system:

- **Single Responsibility**: Each class has one purpose
- **Open/Closed**: Extensible through interfaces
- **Liskov Substitution**: All providers are interchangeable
- **Interface Segregation**: Focused interfaces
- **Dependency Inversion**: Depend on abstractions

Example: `stravaConfigProvider.ts` implements a provider pattern with:
- `IConfigProvider` interface
- `EnvConfigProvider`, `StorageConfigProvider` implementations
- `CompositeConfigProvider` for fallback chains
- `ConfigProviderFactory` for creation

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
4. OAuth flow: redirect to Strava → callback with code → exchange for token
5. Token stored in Zustand store + localStorage
6. Auto-refresh on expiry

### Configuration System
```typescript
// Provider pattern for flexibility
IConfigProvider
├── EnvConfigProvider (env vars)
├── StorageConfigProvider (localStorage)
└── CompositeConfigProvider (fallback chain)

// Used by stores
stravaConfigStore.ts uses ConfigProviderFactory
```

### State Management
- **authStore**: Access tokens, athlete data
- **stravaConfigStore**: Client ID/Secret
- **settingsStore**: UI preferences

## 🧪 Testing Guidelines

### Test Structure
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup mocks
  });

  describe('feature group', () => {
    it('should do specific thing', () => {
      // Arrange, Act, Assert
    });
  });
});
```

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

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build           # Production build
npm run preview         # Preview build

# Quality Checks
npm run type-check      # TypeScript
npm run lint            # ESLint
npm run lint:fix        # Auto-fix
npm run format          # Prettier
npm run format:check    # Check formatting

# Testing
npm test                # Watch mode
npm test -- --run       # Single run
npm run test:coverage   # With coverage
npm run test:ui         # Vitest UI

# All Checks
npm run validate        # Run all checks
npm run ci:local        # Simulate CI
```

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
