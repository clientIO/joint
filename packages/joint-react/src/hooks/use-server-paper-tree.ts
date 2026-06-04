import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { dia } from '@joint/core';
import { useGraphStore } from './use-graph-store';
import { isServerEnvironment } from '../utils/ssr';
import { getServerPaperRenderer } from '../utils/server-paper-renderer';
import type { PaperProps } from '../components/paper/paper.types';

/** Reads a CSS length as a number, or `undefined` when it is not a plain number. */
function toNumber(value: CSSProperties['width']): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/** Options for {@link useServerPaperTree}. */
export interface ServerPaperTreeOptions {
  /** Effective paper id. */
  readonly paperId: string;
  /** Whether the paper is externally managed (skip server generation). */
  readonly isExternalPaper: boolean;
  /** The Paper props (renderers, style, paper options). */
  readonly props: Readonly<PaperProps>;
}

/**
 * Builds the diagram React tree for `<Paper>` on the server.
 *
 * On the server — and only when `@joint/react/server` has registered
 * the renderer — this builds the full diagram (positioned nodes, links, and
 * `renderElement` content) from the `GraphProvider` graph, so a plain
 * `<GraphProvider><Paper renderElement={…} /></GraphProvider>` renders a complete
 * diagram with no extra wiring. The returned tree is rendered by the outer
 * `renderToString`, so `renderElement` runs natively in the same pass.
 *
 * Returns `undefined` on the client, where the live paper mounts normally.
 * @param options - paper id, external flag, and props.
 * @returns the diagram React tree, or `undefined`.
 */
export function useServerPaperTree(options: ServerPaperTreeOptions): ReactNode {
  const { paperId, isExternalPaper, props } = options;
  const graphStore = useGraphStore();

  return useMemo(() => {
    if (isExternalPaper || !isServerEnvironment()) {
      return;
    }
    const renderer = getServerPaperRenderer();
    if (!renderer) {
      return;
    }

    // `linkRouting` is a bundle of `dia.Paper.Options` (router/connector). Spread
    // it like the client (`useCreatePortalPaper`) so links route identically on
    // the server — otherwise the JS-disabled first paint would differ.
    const paperOptions: Partial<dia.Paper.Options> = { ...props.options, ...props.linkRouting };
    if (props.drawGrid !== undefined) {
      paperOptions.drawGrid = props.drawGrid;
    }
    if (props.gridSize !== undefined) {
      paperOptions.gridSize = props.gridSize;
    }
    if (props.background !== undefined) {
      paperOptions.background = props.background;
    }

    try {
      const { tree } = renderer({
        graph: graphStore.graph,
        graphStore,
        renderElement: props.renderElement,
        renderLink: props.renderLink,
        portalSelector: props.portalSelector,
        paperId,
        width: toNumber(props.style?.width),
        height: toNumber(props.style?.height),
        paperOptions,
      });
      return tree;
    } catch {
      // SSR is best-effort: if building the server tree throws, degrade to a
      // client-mounted paper (return `undefined`) instead of failing the whole
      // `renderToString`. The client hydrates the live paper as usual.
      return;
    }
    // Server rendering is one-shot — generate once per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
