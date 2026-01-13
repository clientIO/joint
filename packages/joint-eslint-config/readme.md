# Shared package for using eslint config.

Configuring ESLint in multiple projects is a repetitive task, so we created this package to share a common ESLint configuration across all JointJS packages.

### Issue with running `yarn lint`

If there is an issue with running `yarn lint`, try removing `node_modules/` and re-installing from monorepo root! This should fix the issue, as sometimes, when `yarn install` is used in a monorepo package directly, it **overwrites** default `eslint-configs`.

To avoid these issues, **use `yarn install` directly from monorepo root folder**, instead of per package.
