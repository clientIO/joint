# JointJS Mock SVG (Jest preset)

A Jest preset to mock SVG methods not implemented in JSDOM used by *[JointJS](https://www.jointjs.com/)*.

The mocks themselves are [`@joint/mock-svg`](../joint-mock-svg).

## Usage

Set the preset in your `jest.config.js`:

```js
module.exports = {
  preset: '@joint/jest-preset-mock-svg',
};
```

That is all it does:

```js
{
  testEnvironment: 'jsdom',
  setupFiles: [require.resolve('@joint/mock-svg')],
  transformIgnorePatterns: ['node_modules/(?!@joint/)'],
}
```

Jest merges a preset *under* your own config, so every value remains yours to override.

`testEnvironment` is pinned because the mocks patch SVG globals that the `node` environment does not have. Jest 28 and later do not bundle `jest-environment-jsdom`, so install it alongside:

```sh
npm install --save-dev jest-environment-jsdom
```

### If you set `transformIgnorePatterns` yourself

Jest does not transform `node_modules`, and the `@joint/*` packages ship ES modules, so without an exception a test importing one fails with `SyntaxError: Unexpected token 'export'` before any mock matters. The preset adds that exception.

It is a single setting, though, not a merge. If you set `transformIgnorePatterns` yourself — for some other ESM dependency — you replace the preset's array wholesale and silently lose the `@joint` exception. Carry it in your own value:

```js
module.exports = {
  preset: '@joint/jest-preset-mock-svg',
  transformIgnorePatterns: ['node_modules/(?!@joint/|some-other-esm-dep/)'],
};
```

Note where the slash goes. `node_modules/(?!@joint)/` — the form usually copied around — requires a literal `/` immediately after the lookahead, so it matches no real path: it empties the ignore list and transforms the whole of `node_modules`. That does work, slowly, which is why the mistake tends to go unnoticed.

### Create React App

CRA owns the Jest config and accepts neither `preset` nor `setupFiles`, so this package cannot help it. Import the mocks from the setup file CRA does honour, and pass the pattern on the command line:

```ts
// src/setupTests.ts
import '@joint/mock-svg';
```

```json
"test": "react-scripts test --transformIgnorePatterns \"node_modules/(?!@joint/)\""
```

## License

Copyright © 2013-2026 client IO

Released under the MIT license. See [LICENSE](./LICENSE).
