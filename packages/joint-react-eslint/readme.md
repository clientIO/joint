# Shared package for using eslint config.
Configure eslint in many projects is repeated task, so we created this package to share the same eslint config across all react projects.
It is used just internally, and for react projects `@joint/react` and `@joint/plus-react`.

### Issue with running `yarn lint`
If there is some issue with running yarn lint, just remove `node_modules` and try re-install again from monorepo root! This should fix the issue, as sometimes, when `yarn install ` is used in monorepo package directly, it **overwrite** default `eslint-configs`. 
For avoid this issues, **use `yarn install` directly from the monorepo root folder**, instead of per package.

