# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@joint/react` is the React bindings library for JointJS. It provides React components and hooks for building diagramming applications with JointJS, rendering diagram elements as React components via SVG foreignObject portals.

**Stack:** TypeScript 5.9, React 19 (peer: >=18 <20), esbuild (build), Vite (storybook/dev), Jest 30 + @testing-library/react (testing), ESLint 9 flat config, Storybook 10

## Common Commands

```bash
# Build (esbuild → dist/cjs, dist/esm, dist/types)
yarn build

# Run all checks (typecheck + lint + jest)
yarn test

# Run individual checks
yarn typecheck              # tsc --noEmit
yarn lint                   # ESLint
yarn lint-fix               # ESLint with auto-fix
yarn jest                   # Jest tests only

# Run a single test file
yarn jest --testPathPattern="use-elements"

# Run tests in watch mode
yarn jest --watch

# Storybook (dev server on :6006)
yarn storybook

# Build storybook
yarn build-storybook
```

# Clean Code & Style Guidelines

## General

- Prefer clear, explicit code over clever one-liners. Maintainability > brevity.
- When editing existing code, preserve the existing style unless I explicitly ask for a refactor.
- Leave code cleaner than you found it. Continuously refactor small things instead of accumulating technical debt.

## Constants Over Magic Numbers

- Replace hard-coded values with named constants.
- Use descriptive constant names that explain the value's purpose.
- Keep constants at the top of the file

## Meaningful Names

- Variables, functions, and classes should reveal their purpose.
- Names should explain **why** something exists and **how** it is used.
- Avoid abbreviations unless they are truly universal (e.g. `id`, `URL`, `HTML`).
- Boolean names must be self-descriptive and read like conditions:
  - Use prefixes: `is`, `has`, `should`, `can`, `must`, `needs` (e.g. `isOpen`, `hasError`, `shouldRetry`).
  - Avoid generic names like `flag`, `ok`, `state`, `enabled` without context.
- Function names should describe behavior, not implementation details.

## File Naming (TypeScript / JavaScript)

- All `.ts`, `.tsx`, `.js`, `.jsx` files must use **kebab-case**:
  - Examples: `user-profile.ts`, `something-table.tsx`
- React component files:
  - File name: kebab-case (e.g. `user-profile-card.tsx`).
  - Component name inside: `PascalCase` (e.g. `UserProfileCard`).

## Smart Comments

- Do **not** comment on what the code does if the code can be made self-explanatory instead.
- Prefer to improve the code so it reads clearly without comments.
- Use comments to explain:
  - Why something is done in a non-obvious way.
  - Important constraints, assumptions, or business rules.
  - Non-obvious side effects.
- Document APIs, complex algorithms, and tricky edge cases.

## Single Responsibility

- Each function should do exactly one thing.
- Functions should be small and focused.
- If a function needs a long comment to explain what it does, consider splitting it into smaller functions.
- JSDoc is mandatory for all exported functions.

## DRY (Don't Repeat Yourself)

- Extract repeated code into reusable functions or utilities.
- Share common logic through proper abstractions.
- Maintain single sources of truth for configuration, constants, and shared logic.

## Clean Structure

- Keep related code together.
- Organize code in a logical hierarchy (modules, domains, features).
- Use consistent file and folder naming conventions.
- Avoid "god" files that own too many responsibilities.

## Encapsulation

- Hide implementation details behind clear interfaces.
- Expose only what is needed from a module.
- Move nested conditionals or complex logic into well-named helper functions.

## TypeScript

- Never use `any` in new code:
  - Prefer proper types, generics, unions, or `unknown` + narrowing.
  - If `any` is unavoidable at a boundary (e.g. 3rd-party library), isolate it and add a clear `TODO` explaining why.
- Write `strict`-friendly code:
  - No implicit `any`.
  - Avoid sloppy or unnecessary `as` casts.
  - Avoid `as any` and non-null assertions (`!`) unless absolutely necessary; justify them with a short comment.
- Use `interface`/`type` aliases for data structures instead of loose objects.
- Keep function signatures explicit and well-typed, especially for exported functions and public APIs.
- Prefer readonly/immutable data where reasonable (e.g. `readonly` props, avoid mutating function arguments).

## Performance Mindset

- Avoid unnecessary allocations and copies:
  - No pointless spreading (`{ ...obj }`) or `JSON.parse(JSON.stringify(...))` in hot paths.
- Avoid creating new functions/objects inside tight loops or very frequently rendered components unless memoized.
- Use `useMemo` / `useCallback` **only** when they prevent real, recurring work or re-renders, not everywhere by default.
- Be careful not to introduce extra re-renders by changing prop shapes unnecessarily.
- Prefer algorithmic improvements and proper data structures over micro-optimizations when performance is a concern.

## Code Quality Maintenance

- Refactor continuously in small, safe steps.
- Fix technical debt early when you touch a piece of code.
- Prefer explicit, predictable behavior over clever tricks.
- Keep the codebase internally consistent.

## Testing & Safety

- For non-trivial logic changes, prefer adding or updating tests.
- Write tests before fixing bugs when possible (regression tests).
- Keep tests readable, deterministic, and maintainable.
- Test edge cases, error conditions, and boundary values.
- Avoid relying on implementation details; test behavior and contracts.
- Performance is must have, so test it.
