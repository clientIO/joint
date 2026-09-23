// The mocks themselves live in `@joint/mock-svg`, which depends on no test
// runner, so that this package installs the same set every other integration
// does rather than keeping a copy of its own.
//
// This module stays as the entry point the plugin injects, and as the published
// `@joint/vitest-plugin-mock-svg/mocks` path, so nothing downstream changes.
import '@joint/mock-svg';
