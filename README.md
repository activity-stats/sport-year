# Sport Year 🏃

A beautiful web application to visualize your Strava activities and create shareable year-in-review summaries.

![CI](https://github.com/activity-stats/sport-year/workflows/CI/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📚 Documentation

- **[README](./README.md)** - This file, project overview
- **[CONTRIBUTING](./CONTRIBUTING.md)** - How to contribute
- **[SECURITY](./SECURITY.md)** - Security policies and reporting
- **[AGENT](./AGENT.md)** - AI agent instructions and architecture
- **[LICENSE](./LICENSE)** - MIT License

## ✨ Features

- 📊 **Interactive Dashboard** - View your activities with charts and statistics
- 📅 **Year-in-Review** - Generate beautiful summaries of your athletic achievements
- 🎨 **Customizable** - Choose themes, select activities, and personalize your review
- 📱 **Shareable** - Export as images to share on social media
- 🔒 **Privacy First** - All credentials stored locally in your browser
- 🏃 **Multi-Sport** - Supports running, cycling, swimming, and more

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- A Strava account

### Installation

```bash
# Clone the repository
git clone https://github.com/activity-stats/sport-year.git
cd sport-year

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173`

### Setup Strava

1. Create a Strava API application at https://www.strava.com/settings/api
2. Use these settings:
   - **Application Name**: Sport Year (or your choice)
   - **Category**: Data Importer or Visualizer
   - **Website**: `http://localhost:5173` (or your domain)
   - **Authorization Callback Domain**: `localhost:5173` (domain only, no http://)
3. Copy your **Client ID** and **Client Secret**
4. Enter them in the Sport Year setup wizard

## 🛠️ Development

```bash
# Run development server
npm run dev

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (first time: install browsers)
npm run e2e:setup
npm run test:e2e

# E2E test variations
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:headed    # See browser in action
npm run test:e2e:debug     # Debug with Playwright Inspector

# Type check
npm run type-check

# Lint and format
npm run lint
npm run format

# Run all quality checks (CI simulation)
npm run validate
```

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **Recharts** - Data visualization
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## 🧪 Testing

### Unit Tests

- 291 unit tests with ~90% statement coverage
- React Testing Library for component tests
- Vitest for test runner
- Run: `npm test`

### E2E Tests

- 105 E2E tests (35 tests × 3 browsers)
- Playwright testing framework
- Comprehensive mock data including triathlon activities
- First-time setup: `npm run e2e:setup`
- Run: `npm run test:e2e`

See [TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md) for detailed testing approach.

## 🔒 Security

- All credentials stored locally (localStorage)
- No data sent to external servers except Strava API
- Environment variables for configuration
- Security-hardened CI/CD pipeline
- Regular dependency audits

See [SECURITY.md](./SECURITY.md) for more details.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with Strava API
- Inspired by the athletic community
- Thanks to all contributors

## 📞 Support

- Issues: https://github.com/activity-stats/sport-year/issues
- Discussions: https://github.com/activity-stats/sport-year/discussions
