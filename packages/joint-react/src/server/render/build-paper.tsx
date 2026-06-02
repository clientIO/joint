import type { ReactNode } from 'react';
import type { dia } from '@joint/core';
import { PaperStore } from '../../store/paper-store';
import { ReactPaper } from '../../models/react-paper';
import { GraphStoreContext, PaperStoreContext, CellIdContext } from '../../context';
import { defaultRenderElement } from '../../components/paper/default-render-element';
import type { CellId, ElementRecord, LinkRecord } from '../../types/cell.types';
import type {
  ServerPaperRenderOptions,
  AnyGraphStore,
  AnyRenderer,
} from '../../utils/server-paper-renderer';

/** No-op that detaches the paper from graph-store view-sync after the build. */
const NOOP_VIEW_MOUNT_CHANGE = (): void => {};

interface ServerCellProvidersProps {
  readonly graphStore: AnyGraphStore;
  readonly paperStore: PaperStore;
  readonly cellId: CellId;
  readonly children: ReactNode;
}

/**
 * Supplies the store + cell contexts a `renderElement` / `renderLink` may read
 * via hooks (`useCell`, `useCellId`, `useGraphStore`, `usePaper`, `useMeasureNode`).
 * @param props - the contexts and children to provide.
 * @returns the children wrapped in the joint-react server contexts.
 */
function ServerCellProviders(props: Readonly<ServerCellProvidersProps>): ReactNode {
  const { graphStore, paperStore, cellId, children } = props;
  return (
    <GraphStoreContext.Provider value={graphStore}>
      <PaperStoreContext.Provider value={paperStore}>
        <CellIdContext.Provider value={cellId}>{children}</CellIdContext.Provider>
      </PaperStoreContext.Provider>
    </GraphStoreContext.Provider>
  );
}

/** Derives `[width, height]` from the graph content box when not explicitly set. */
function resolveSize(
  graph: dia.Graph,
  width: number | undefined,
  height: number | undefined
): readonly [number, number] {
  if (width !== undefined && height !== undefined) {
    return [width, height];
  }
  const contentBox = graph.getBBox();
  const derivedWidth = contentBox ? Math.ceil(contentBox.x + contentBox.width) : 0;
  const derivedHeight = contentBox ? Math.ceil(contentBox.y + contentBox.height) : 0;
  return [width ?? derivedWidth, height ?? derivedHeight];
}

/** A built-and-mounted server paper, ready to read views from. */
export interface ServerPaperSetup {
  readonly paper: ReactPaper;
  readonly paperStore: PaperStore;
  readonly host: HTMLElement;
  readonly width: number;
  readonly height: number;
}

/**
 * Builds a JointJS paper synchronously in the headless DOM with every view
 * mounted, so its DOM can be converted to a React tree. Assumes the DOM shim is
 * installed (the `@joint/react/server` entry guarantees this).
 * @param options - graph, store, and paper options.
 * @returns the mounted paper, its store, host element, and resolved size.
 */
export function setupServerPaper(options: ServerPaperRenderOptions): ServerPaperSetup {
  const { graph, graphStore, portalSelector, paperId, width, height, paperOptions } = options;
  const [resolvedWidth, resolvedHeight] = resolveSize(graph, width, height);

  const host = document.createElement('div');
  document.body.append(host);

  const paper = new ReactPaper({
    model: graph,
    id: paperId,
    portalSelector,
    el: host,
    ...paperOptions,
    // joint-react-controlled options: forced for synchronous, fully-mounted
    // server rendering. Must come after `paperOptions` so they cannot be undone.
    width: resolvedWidth,
    height: resolvedHeight,
    async: false,
    // Construct frozen so `super()` (dia.Paper) does NOT render cells before
    // ReactPaper's class fields (`viewChanges`, ...) initialize — JS runs field
    // initializers only after `super()` returns. We unfreeze right after.
    frozen: true,
    autoFreeze: false,
    viewManagement: { disposeHidden: false, lazyInitialize: false },
  });

  // unfreeze starts rendering; updateViews flushes all scheduled updates
  // synchronously (`async: false`, no viewport culling, eager view init).
  paper.unfreeze();
  paper.updateViews();

  // Reveal every link. ReactPaper hides a link (visibility:hidden) until its
  // endpoints' React content has mounted into the DOM — but during SSR that
  // content is spliced into the React tree separately, so the portals are empty
  // at build time. On the server every element renders, so all links are shown.
  for (const linkCell of graph.getLinks()) {
    const linkView = paper.getLinkView(linkCell.id as CellId);
    if (linkView?.el) {
      linkView.el.style.visibility = '';
    }
  }

  // PaperStore backs `usePaper()` inside renderers. Neutralize its graph-store
  // view-sync callback: the build is one-shot.
  const paperStore = new PaperStore({ graphStore, id: paperId, paper, paperOptions: {} });
  paper.onViewMountChange = NOOP_VIEW_MOUNT_CHANGE;

  return { paper, paperStore, host, width: resolvedWidth, height: resolvedHeight };
}

/** Wraps a cell's renderer output in the server cell contexts. */
function createCellContentNode(
  renderer: AnyRenderer,
  data: Record<string, unknown>,
  graphStore: AnyGraphStore,
  paperStore: PaperStore,
  cellId: CellId
): ReactNode {
  const Renderer = renderer as (data: Record<string, unknown>) => ReactNode;
  return (
    <ServerCellProviders graphStore={graphStore} paperStore={paperStore} cellId={cellId}>
      <Renderer {...data} />
    </ServerCellProviders>
  );
}

/** Reads a cell's `data` slice from the store projection. */
function getCellData(graphStore: AnyGraphStore, cellId: CellId): Record<string, unknown> {
  const record = graphStore.graphProjection.cells.get(cellId) as
    | ElementRecord
    | LinkRecord
    | undefined;
  return (record?.data as Record<string, unknown> | undefined) ?? {};
}

/** Resolves a cell's view from the paper (element or link). */
type CellViewLookup = (cellId: CellId) => dia.CellView | undefined;

/**
 * Maps each cell's portal node to its React content node (renderer + contexts),
 * for one cell kind (elements or links).
 */
function collectCellKindContents(
  setup: ServerPaperSetup,
  graphStore: AnyGraphStore,
  cells: readonly dia.Cell[],
  getView: CellViewLookup,
  renderer: AnyRenderer,
  contents: Map<Element, ReactNode>
): void {
  const { paper, paperStore } = setup;
  for (const cell of cells) {
    const cellId = cell.id as CellId;
    const view = getView(cellId);
    if (!view) continue;
    const portalNode = paper.getCellViewPortalNode(view);
    if (!portalNode) continue;
    const data = getCellData(graphStore, cellId);
    contents.set(portalNode, createCellContentNode(renderer, data, graphStore, paperStore, cellId));
  }
}

/**
 * Maps each cell's portal node to its React content node (renderer + contexts),
 * for splicing into the converted React tree.
 * @param setup - the mounted server paper.
 * @param options - render options (graph, renderers, store).
 * @returns a map of portal DOM node to React content.
 */
export function collectCellContents(
  setup: ServerPaperSetup,
  options: ServerPaperRenderOptions
): Map<Element, ReactNode> {
  const { paper } = setup;
  const { graph, graphStore } = options;
  const renderElement = options.renderElement ?? defaultRenderElement;
  const { renderLink } = options;
  const contents = new Map<Element, ReactNode>();

  collectCellKindContents(
    setup,
    graphStore,
    graph.getElements(),
    (cellId) => paper.getElementView(cellId),
    renderElement,
    contents
  );

  if (renderLink) {
    collectCellKindContents(
      setup,
      graphStore,
      graph.getLinks(),
      (cellId) => paper.getLinkView(cellId),
      renderLink,
      contents
    );
  }

  return contents;
}
