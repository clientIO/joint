# JointJS Sanitize

Sanitizers for untrusted [JointJS](https://github.com/clientio/joint) graph JSON and HTML.

JointJS renders graph JSON as it is: markup, attributes, ports and labels from an untrusted source (e.g. a file import or a collaborative editing session) can run scripts in the page. Sanitize such JSON before it enters the graph.

Works with `@joint/core` 4.1 and later.

## Installation

```bash
npm install @joint/sanitize
```

## Usage

```js
import { dia, shapes } from '@joint/core';
import { sanitizeGraphJSON, sanitizeCellJSON, sanitizeCellAttributes, sanitizeHTML } from '@joint/sanitize';

const graph = new dia.Graph({}, { cellNamespace: shapes });

// `graph.fromJSON()`
graph.fromJSON(sanitizeGraphJSON(untrustedJSON, { cellNamespace: shapes }));

// `graph.addCell()`, `graph.addCells()`, `graph.resetCells()`
graph.addCell(sanitizeCellJSON(untrustedCellJSON, { cellNamespace: shapes }));

// `cell.set()`
cell.set(sanitizeCellAttributes(cell, untrustedAttributes));

// HTML to be inserted into an HTML element
element.innerHTML = sanitizeHTML(untrustedHTML);
```

Use the same `cellNamespace` as the graph.

### Options

- `cellNamespace` - the namespace of the cell constructors (the `cellNamespace` of the graph).
- `onRemove(path, reason)` - called for every removed part of the JSON.
- `strict` - `true` (the default) removes string markup and the `html` attribute. `false` sanitizes them instead (requires a DOM).

See `index.d.ts` for the details of what is removed and what is not checked.

### Script tag

The UMD build (`dist/sanitize.js`) adds the functions to `joint.util`. Its `sanitizeHTML()` replaces the one of `@joint/core`.

### Tests

Generate distribution files from the source code:
```bash
yarn run dist
```

To run all tests:
```bash
yarn run test
```

## License

[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

Copyright © 2013-2026 client IO
