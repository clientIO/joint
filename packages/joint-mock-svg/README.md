# JointJS Mock SVG

Mocks of the SVG globals JSDOM does not implement but *[JointJS](https://www.jointjs.com/)* relies on — `SVGAngle`, `createSVGMatrix`, `getBBox`, `transform.baseVal` and friends.

This package is **test-runner agnostic**: it depends on no test runner and uses no spies, so it can be consumed from any of them.

## Usage

Import it once, before your tests run, in a DOM environment:

```js
import '@joint/mock-svg';
```

The import is side-effectful: it installs the mocks on `globalThis` and exports nothing. It throws if there is no DOM, since the mocks are meaningless without one.

Where that import belongs depends on your runner — it needs to run before any test file touches the SVG globals, which usually means a setup-file option rather than an import in the test itself.

## Why no spies

Nothing in these mocks is ever asserted on — they exist to make JSDOM survive a JointJS render, not to record calls. Using plain functions rather than mock functions buys two things:

* **no runner dependency**, which is what lets one implementation serve every runner;
* **immunity to mock resets.** Options such as `resetMocks`, `clearMocks` and `restoreMocks` strip the implementation from a mock function, which silently breaks a spy-based version between tests — Create React App enables `resetMocks` by default. A plain function is not a mock function, so there is nothing to reset, and no `beforeEach` reinstallation is needed.

## License

Copyright © 2013-2026 client IO

Released under the MIT license. See [LICENSE](./LICENSE).
