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

The mocks themselves come from [`@joint/mock-svg`](../joint-mock-svg) as plain functions. If your test needs to assert on one of them, or change what the mock returns, use `vi.spyOn()`.

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

`vi.spyOn` reaches nested members too, as well - for example `vi.spyOn(SVGElement.prototype.transform.baseVal, 'appendItem')`.

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

## License

Copyright © 2013-2026 client IO

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
