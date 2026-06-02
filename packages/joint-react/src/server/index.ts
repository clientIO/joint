// @joint/react/server — enable server-side rendering of `<Paper>`.
//
// Import this once, before anything that pulls in `@joint/core` (e.g. as the
// first import of your SSR entry, or via Next.js `instrumentation.ts`):
//
//   import '@joint/react/server';
//
// It installs a headless DOM and registers the server paper renderer, so a plain
// `<GraphProvider><Paper renderElement={…} /></GraphProvider>` rendered with
// `renderToString` (from `react-dom/server`) emits the full diagram SVG — which
// then hydrates into the live, interactive paper on the client.

// Side effects, in order: `@joint/svg-shim/install` installs the shim, and must
// run before `./render/build-paper-tree` (which evaluates `@joint/core`) — ES
// modules evaluate imports in source order.
import '@joint/svg-shim/install';
import { setTextStyleResolver } from '@joint/svg-shim';
import { getTextStyle } from './text-style';
import { registerServerPaperRenderer } from '../utils/server-paper-renderer';
import { buildPaperReactTree } from './render/build-paper-tree';

// Teach the (framework-agnostic) shim how `@joint/react`'s theme sizes text, so
// label/port backgrounds are measured at the size the browser renders.
setTextStyleResolver(getTextStyle);
registerServerPaperRenderer(buildPaperReactTree);

// Advanced: choose a different DOM provider before the shim auto-installs.
// `isDomShimInstalled` is a diagnostic companion (whether the shim has run).
export { installDomShim, isDomShimInstalled } from '@joint/svg-shim';
export type {
  DomShimOptions,
  DomProvider,
  ShimWindow,
  ShimWindowFactory,
} from '@joint/svg-shim';
