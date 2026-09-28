# JointJS Mock SVG

Mocks of those SVG globals that JSDOM does not implement but *[JointJS](https://www.jointjs.com/)* relies on, including `SVGAngle`, `createSVGMatrix()`, `getBBox()`, and `transform.baseVal`.

This package is **test-runner agnostic**: it depends on no test runner and uses no spies, so it can be consumed from any of them.

## Usage

Import it once, before your tests run, in a DOM environment:

```js
import '@joint/mock-svg';
```

The import is side-effectful: it installs the mocks on `globalThis` and exports no value. Note that a DOM is required - without it the import fails.

Where that import belongs depends on your runner - it needs to run before any test file touches the SVG globals, which usually means a setup-file option rather than an import in the test itself.

## TypeScript

`getBBox()`, `getScreenCTM()`, `getComputedTextLength()` and `transform` are mocked on `SVGElement`, one level wider than where DOM types (`lib.DOM`) declare them, because JSDOM makes `<rect>`, `<path>` and `<text>` plain `SVGElement`s. Reading one of them off `SVGElement.prototype` - like when spying on the mocks - therefore needs the exported `MockedSVGElement` type. For example:

```ts
import type { MockedSVGElement } from '@joint/mock-svg';

jest.spyOn(SVGElement.prototype as MockedSVGElement, 'getBBox')
    .mockReturnValue({ x: 0, y: 0, width: 100, height: 50 } as DOMRect);
```

## License

The *@joint/mock-svg* library is licensed under the [MIT License](https://github.com/clientIO/joint/blob/master/packages/joint-mock-svg/LICENSE).

Copyright © 2013-2026 client IO
