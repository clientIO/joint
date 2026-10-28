# Security Policy

## Supported Versions

The [latest released version](https://github.com/clientIO/joint/releases) of JointJS is supported.

## Reporting a Vulnerability

Please email security@client.io, and we will respond as quickly as possible.

If the vulnerability is considered valid and accepted, a patch will be made for the latest JointJS version.
If the vulnerability is deemed invalid, no further action is required.

## Untrusted Data

JointJS renders the cell attributes (e.g. `markup`, `attrs`, `ports` and `labels`) as they are. Graph JSON or cell attributes from an untrusted source (e.g. a file import, another user in a collaborative session, a URL parameter) can run scripts in the page.

Sanitize such data with [`@joint/sanitize`](https://www.npmjs.com/package/@joint/sanitize) before it enters the graph:

- `graph.fromJSON()` - `sanitizeGraphJSON()`
- `graph.addCell()`, `graph.addCells()`, `graph.resetCells()`, `new Shape(attributes)` - `sanitizeCellJSON()`
- `cell.set()` - `sanitizeCellAttributes()`
- `cell.prop()`, `cell.attr()` and the port and label methods - apply the change to a copy of the top-level attribute, sanitize it with `sanitizeCellAttributes()` and set it with `cell.set()`
