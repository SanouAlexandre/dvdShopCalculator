# Contributing to DVD Shop Calculator

Thank you for your interest in contributing to the DVD Shop Calculator project! 🎬

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Please be respectful and professional in all interactions. We welcome contributions from everyone.

## Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- Docker >= 24.x (optional)
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone hhttps://github.com/SanouAlexandre/dvdShopCalculator
   cd dvd-shop-calculator
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Locally

| Command | Description |
|---------|-------------|
| `npm start` | Start web server (http://localhost:3000) |
| `npm run start:cli` | Start interactive CLI mode |
| `npm run start:dev` | Web server in development mode |
| `npm run start:cli:dev` | CLI in development mode |
| `npm run build` | Build TypeScript |
| `npm run watch` | Watch mode for TypeScript |

```bash
# Build the project
npm run build

# Start the server
npm start
```

### Using Docker

```bash
# Start development environment
docker-compose -f docker/docker-compose.yml up

# Run tests in Docker
docker-compose -f docker/docker-compose.yml --profile test up test
```

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer `readonly` for immutable properties
- Use explicit return types for functions
- Avoid `any` type

### Style Guide

- Run `npm run lint` before committing
- Run `npm run format` to format code
- Follow existing code patterns

### Naming Conventions

- **Files**: camelCase for regular files, PascalCase for classes/components
- **Variables/Functions**: camelCase
- **Classes/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE

## Testing

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

### Test Requirements

- All new features must have tests
- Maintain > 90% code coverage
- Write unit tests for individual functions
- Write integration tests for scenarios

### Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for scenarios
└── e2e/           # End-to-end API tests
```

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `npm test`
2. Ensure code is formatted: `npm run format`
3. Ensure linting passes: `npm run lint`
4. Update documentation if needed

### PR Guidelines

1. Use a clear, descriptive title
2. Reference any related issues
3. Provide a detailed description of changes
4. Include screenshots for UI changes

### Review Process

1. At least one approval required
2. All CI checks must pass
3. Squash commits before merging

## Adding New Features

### Adding a New Discount Rule

1. Create a new rule class in `src/core/rules/`
2. Implement the `DiscountRule` interface
3. Register the rule in the Calculator
4. Add comprehensive tests

Example:
```typescript
import { DiscountRule } from './DiscountRule';

export class MyNewDiscountRule implements DiscountRule {
  readonly name = 'My New Discount';
  
  applies(cart: Cart): boolean {
    // Your logic here
  }
  
  // ... implement other methods
}
```

### Adding New API Endpoints

1. Add route handler in `src/infrastructure/api/routes/`
2. Add validation middleware if needed
3. Add E2E tests
4. Update API documentation

## Questions?

Feel free to open an issue for any questions or discussions.

Happy coding! 
