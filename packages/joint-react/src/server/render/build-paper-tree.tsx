import { setupServerPaper, collectCellContents } from './build-paper';
import { hostChildrenToReact } from './dom-to-react';
import type {
  ServerPaperRenderOptions,
  ServerPaperRenderResult,
} from '../../utils/server-paper-renderer';

/**
 * Builds a paper's diagram as a React node tree (not a string). This is the
 * renderer `<Paper>` uses during SSR: the returned tree is rendered by the outer
 * `renderToString`, so `renderElement` content renders natively in the same pass
 * — no nested `renderToStaticMarkup`.
 *
 * The host DOM is detached, but the paper + store are intentionally left alive:
 * the tree's spliced `renderElement` nodes reference them via context, so they
 * must outlive this call. Both are short-lived and GC'd with the SSR response.
 * @param options - graph, store, renderers, and paper options.
 * @returns the diagram React tree and the host size used.
 */
export function buildPaperReactTree(options: ServerPaperRenderOptions): ServerPaperRenderResult {
  const setup = setupServerPaper(options);
  try {
    const contents = collectCellContents(setup, options);
    const tree = hostChildrenToReact(setup.host, contents);
    return { tree, width: setup.width, height: setup.height };
  } finally {
    // Always detach the host, even if building throws — otherwise a failed build
    // would leak a detached subtree into the shared headless DOM.
    setup.host.remove();
  }
}
