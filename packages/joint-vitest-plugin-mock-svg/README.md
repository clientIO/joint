# JointJS Mock SVG

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

## License

[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

Copyright © 2013-2024 client IO
