# Contributing to PR Review CLI

Thank you for your interest in contributing to PR Review CLI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue using the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include as much detail as possible:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
- Relevant logs or error messages

### Suggesting Features

Feature requests are welcome! Please use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) to describe:

- The problem you're trying to solve
- Your proposed solution
- Alternative solutions you've considered
- Any additional context

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Ensure all checks pass** (tests, linting, type checking)
6. **Submit a pull request** using our PR template

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Getting Started

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pull-request-reviewer-ai.git
   cd pull-request-reviewer-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes and test them:
   ```bash
   npm run build
   npm test
   npm run lint
   npm run typecheck
   ```

3. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a Pull Request on GitHub

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style

- Run `npm run lint` before committing
- Run `npm run format` to auto-format code
- Follow the existing code structure and patterns

### Testing

- Write tests for new features and bug fixes
- Aim for good test coverage
- Use descriptive test names
- Test both success and error cases

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding or updating tests
- `chore:` for maintenance tasks

Examples:
```
feat: add support for custom LLM providers
fix: handle timeout errors gracefully
docs: update installation instructions
```

## Project Structure

```
pr-reviewer/
├── src/
│   ├── cli/          # CLI commands and entry point
│   ├── core/         # Core functionality
│   │   ├── git/      # Git operations
│   │   ├── llm/      # LLM client and providers
│   │   └── review/   # Review engine
│   ├── formatters/   # Output formatters
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
├── tests/            # Test files
├── config/           # Configuration files
└── examples/         # Usage examples
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Building

Build the project:

```bash
npm run build
```

The output will be in the `dist/` directory.

## Documentation

- Update README.md for user-facing changes
- Update code comments for API changes
- Add examples if introducing new features

## Review Process

1. All pull requests require at least one review
2. Maintainers will review your PR and may request changes
3. Address review feedback promptly
4. Once approved, a maintainer will merge your PR

## Questions?

If you have questions about contributing:

- Open an issue with the `question` label
- Check existing issues and discussions
- Review the documentation in the README

Thank you for contributing to PR Review CLI! 🎉
