# Contributing to Sport Year

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/sport-year.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes: `npm run validate`
6. Commit your changes: `git commit -m "feat: add new feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## 📋 Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests in watch mode
npm test

# Run all quality checks
npm run validate
```

## ✅ Before Submitting

Ensure your changes pass all checks:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format:check

# Tests
npm test -- --run

# All checks together
npm run validate
```

Pre-commit hooks will automatically run linting and formatting on staged files.

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add activity export feature
fix: correct distance calculation for cycling
docs: update setup instructions
test: add tests for activity filtering
```

## 🧪 Testing

- Write tests for new features
- Maintain or improve test coverage (aim for 80%+)
- Use React Testing Library for component tests
- Follow existing test patterns

```bash
# Run specific test file
npm test src/components/MyComponent.test.tsx

# Run tests with coverage
npm run test:coverage
```

## 📐 Code Style

- Follow existing code patterns
- Use TypeScript - no `any` types unless absolutely necessary
- Write self-documenting code with clear variable names
- Add comments for complex logic
- Keep functions small and focused (SOLID principles)

### File Organization

```
src/
├── api/            # API clients
├── components/     # React components
├── hooks/          # Custom hooks
├── pages/          # Page components
├── services/       # Business logic
├── stores/         # State management
├── types/          # TypeScript types
└── utils/          # Utility functions
```

## 🔒 Security

- Never commit API keys or secrets
- Use environment variables for configuration
- Report security vulnerabilities privately (see SECURITY.md)
- Follow secure coding practices

## 📖 Documentation

- Update README.md if adding features
- Add JSDoc comments for public APIs
- Update tests documentation
- Include examples for new features

## 🐛 Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

## 💡 Feature Requests

Include:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Examples from other apps (if applicable)

## 🔄 Pull Request Process

1. **Update documentation** - README, comments, etc.
2. **Add/update tests** - Ensure good coverage
3. **Pass all CI checks** - Type check, lint, format, tests, security
4. **Keep changes focused** - One feature/fix per PR
5. **Write clear PR description** - What, why, how
6. **Respond to feedback** - Address review comments

### PR Title Format

Follow conventional commits format:
```
feat: add activity filtering by sport type
fix: correct date range selector bug
docs: improve setup instructions
```

## 🤝 Code Review

- Be respectful and constructive
- Explain reasoning behind suggestions
- Accept that multiple approaches can be valid
- Focus on code quality and maintainability

## ❓ Questions

- Open a discussion on GitHub
- Check existing issues and PRs
- Review documentation

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.
