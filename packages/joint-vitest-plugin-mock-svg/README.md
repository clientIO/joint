# JointJS Mock SVG plugin for Vitest

A Vitest plugin to mock SVG methods not implemented in JSDOM used by *[JointJS](https://www.jointjs.com/)*.

## Usage

Import the plugin in your `vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';
import mockSVG from '@joint/vitest-plugin-mock-svg'

export default defineConfig({
  plugins: [mockSVG()],
})
```

The mocks themselves come from [`@joint/mock-svg`](https://github.com/clientIO/joint/tree/master/packages/joint-mock-svg) as plain functions. If your test needs to assert on one of them, or change what the mock returns, use `vi.spyOn()`.

### Changing what a mock returns

The default `getBBox()` returns an all-zero rect, which leaves `checkVisibility()` false and `util.breakText()` with nothing to measure. If your test needs one, give the mock a size object as a return value:

```js
vi.spyOn(SVGElement.prototype, 'getBBox')
  .mockReturnValue({ x: 0, y: 0, width: 100, height: 20 });
```

`mockRestore()`, `vi.restoreAllMocks()` and `restoreMocks: true` all put the mock back afterwards, so an override stays local to its test and the suite needs no `beforeEach` to reinstall anything.

The same spy also records calls. This lets you assert whether JointJS measured anything at all:

```js
const getBBox = vi.spyOn(SVGElement.prototype, 'getBBox');
render(<MyDiagram />);
expect(getBBox).toHaveBeenCalled();
```

`vi.spyOn` reaches nested members, as well - for example `vi.spyOn(SVGElement.prototype.transform.baseVal, 'appendItem')`.

To swap a mock implementation permanently, reassign it:

```js
SVGElement.prototype.getComputedTextLength = () => 42;
```

Restore the previous value yourself if the change should not outlive the file.

### Driving `ResizeObserver`

The mocked observer accepts a callback and never calls it. To deliver entries, or to assert on `observe`, provide your own:

```js
globalThis.ResizeObserver = class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback) { this.callback = callback; }
  resize(entries) { this.callback(entries, this); }
};
```

## TypeScript

`getBBox()`, `getScreenCTM()`, `getComputedTextLength()` and `transform` are mocked on `SVGElement`, one level wider than where DOM types (`lib.DOM`) declare them, because JSDOM makes `<rect>`, `<path>` and `<text>` plain `SVGElement`s. Reading one of them off `SVGElement.prototype` - as every example above does - therefore needs the re-exported `MockedSVGElement` type. For example:

```ts
import type { MockedSVGElement } from '@joint/vitest-plugin-mock-svg';

vi.spyOn(SVGElement.prototype as MockedSVGElement, 'getBBox')
  .mockReturnValue({ x: 0, y: 0, width: 100, height: 20 } as DOMRect);
```

## License

The *@joint/vitest-plugin-mock-svg* library is licensed under the [MIT License](https://github.com/clientIO/joint/blob/master/packages/joint-vitest-plugin-mock-svg/LICENSE).

Copyright © 2013-2026 client IO
