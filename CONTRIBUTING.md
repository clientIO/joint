# Contributing to JointJS

Thank you for your interest in contributing to JointJS! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 22.14.0 (managed via [Volta](https://volta.sh/))
- Yarn 4.7.0

### Installation

```bash
git clone https://github.com/clientIO/joint.git
cd joint
yarn install
```

### Building

```bash
# Build distribution files
yarn dist

# Build all packages
yarn build
```

## Running Tests

```bash
# Run all tests
yarn test

# Run specific test types
yarn test-server       # Server-side tests (Node.js/Mocha)
yarn test-client       # Client-side tests (Browser/Karma/QUnit)
yarn test-ts           # TypeScript type definition tests
yarn test-e2e          # End-to-end tests (Puppeteer)

# Run tests for a specific file (joint-core)
cd packages/joint-core
npm run test-client -- --file=test/jointjs/graph.js
```

## Linting

```bash
# Check for linting errors
yarn lint

# Auto-fix linting errors
yarn lint-fix
```

## Project Structure

This is a Yarn workspace monorepo. Main packages:

- `packages/joint-core` - The main diagramming library
- `packages/joint-react` - React bindings
- `packages/joint-layout-directed-graph` - Graph layout algorithms
- `packages/joint-layout-msagl` - MSAGL layout integration

## Pull Request Guidelines

Before submitting a PR, please verify:

- [ ] Code is up-to-date with the `master` branch
- [ ] You've successfully run `yarn test` locally
- [ ] If applicable, there are new or updated unit tests validating the change
- [ ] If applicable, there are new or updated @types
- [ ] If applicable, documentation has been updated

### Commit Message Format

We use conventional commits. Format: `type(scope): description`

Examples:
- `fix(dia.Graph): correct batch event options`
- `feat(dia.Paper): add new zoom feature`
- `docs: update contributing guide`

Types: `feat`, `fix`, `style`, `refactor`, `test`, `chore`, `example`

## Code Style

- TypeScript strict mode is enabled
- ESLint flat config (v9) via `@joint/eslint-config`
- Run `yarn lint-fix` before committing

## Questions?

- Open an issue on [GitHub](https://github.com/clientIO/joint/issues)
- Visit [jointjs.com](https://jointjs.com) for documentation
