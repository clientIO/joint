/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
/**
 * Reproduces a dev-server hot reload (Vite/webpack Fast Refresh) of
 * `graph-provider.tsx` — clientIO/joint#3483: "diagram becomes broken or
 * empty after HMR".
 *
 * When an edit invalidates the graph-provider module, react-refresh re-renders
 * `<GraphProvider>` with the re-evaluated implementation and React re-runs ALL
 * of its effects (dependency arrays are ignored for a refreshed component).
 * The mount effect therefore destroys the current GraphStore and creates a new
 * one. Every consumer must move onto the new instance: the context must
 * publish it (not bail out on an unchanged `isReady` boolean), every mounted
 * `<Paper>` must re-register against it, an external `graph` must be adopted
 * without being re-seeded, and measurement hooks must start over on the new
 * paper — otherwise the canvas goes blank until a full page reload.
 *
 * The suite drives the REAL react-refresh runtime against the real react-dom:
 * inject the refresh hook before react-dom loads, render, re-evaluate ONLY the
 * graph-provider module (its dependencies stay shared, exactly like Vite HMR),
 * register both versions into the same family, and performReactRefresh().
 *
 * No JSX and no top-level value imports in this file: the refresh hook must
 * exist before react-dom is evaluated, and jest's setup files have already
 * loaded react-dom — so the module registry is reset first and everything is
 * required back in a controlled order. JSX would emit a hoisted
 * `react/jsx-runtime` require above the reset, splitting React in two.
 * Type-only imports are fully erased by the transform, so they are safe here
 * and type the controlled `require` boundaries without `as` casts.
 */
import type { dia } from '@joint/core';
import type { GraphStore as GraphStoreType } from '../../../store';
import type { PaperProps } from '../../paper/paper.types';
import type * as ReactModule from 'react';
import type * as RTLModule from '@testing-library/react';
import type * as CoreModule from '@joint/core';
import type * as ContextModule from '../../../context';
import type * as StoreModule from '../../../store';
import type * as ImperativeApiModule from '../../../hooks/use-imperative-api';
import type * as ElementModelModule from '../../../mvc/element-model';
import type * as LinkModelModule from '../../../mvc/link-model';
import type * as UseGraphStoreModule from '../../../hooks/use-graph-store';
import type * as UseCellIdsModule from '../../../hooks/use-cell-ids';
import type * as UseOnElementsMeasuredModule from '../../../hooks/use-on-elements-measured';
import type * as GraphProviderModule from '../graph-provider';
import type * as PaperModule from '../../paper/paper';

/** The subset of `react-refresh/runtime` this suite drives. */
interface RefreshRuntimeApi {
  readonly injectIntoGlobalHook: (globalObject: unknown) => void;
  readonly register: (type: unknown, id: string) => void;
  readonly performReactRefresh: () => unknown;
}

// Fresh registry so react-dom evaluates AFTER the refresh hook exists.
jest.resetModules();

const refreshRuntime: RefreshRuntimeApi = require('react-refresh/runtime');
refreshRuntime.injectIntoGlobalHook(globalThis);

const React: typeof ReactModule = require('react');
const jsxRuntime: unknown = require('react/jsx-runtime');
const rtl: typeof RTLModule = require('@testing-library/react');
// Deliberately NOT StrictMode: React's strict double-render replay resets
// `ignorePreviousDependencies`, so a Fast Refresh under StrictMode does not
// re-run []-dep effects at all. Non-strict rendering models plain Vite apps
// and lets the refresh exercise the destroy/re-create path this bug lives in.
rtl.configure({ reactStrictMode: false });

// Shared dependencies of graph-provider.tsx, captured once. The re-evaluated
// module must get the SAME instances — exactly like Vite HMR, which re-runs
// only the edited module and serves its imports from cache.
const core: typeof CoreModule = require('@joint/core');
const contextModule: typeof ContextModule = require('../../../context');
const storeModule: typeof StoreModule = require('../../../store');
const imperativeApiModule: typeof ImperativeApiModule = require('../../../hooks/use-imperative-api');

const elementModelModule: typeof ElementModelModule = require('../../../mvc/element-model');
const linkModelModule: typeof LinkModelModule = require('../../../mvc/link-model');
const { useGraphStore }: typeof UseGraphStoreModule = require('../../../hooks/use-graph-store');
const { useCellIds }: typeof UseCellIdsModule = require('../../../hooks/use-cell-ids');
const {
  useOnElementsMeasured,
}: typeof UseOnElementsMeasuredModule = require('../../../hooks/use-on-elements-measured');

const graphProviderV1: typeof GraphProviderModule = require('../graph-provider');
const { Paper }: typeof PaperModule = require('../../paper/paper');

const h = React.createElement;

/** Re-evaluates graph-provider.tsx only, with all its deps shared (Vite HMR). */
function requireGraphProviderV2(): typeof GraphProviderModule {
  jest.doMock('react', () => React);
  jest.doMock('react/jsx-runtime', () => jsxRuntime);
  jest.doMock('../../../context', () => contextModule);
  jest.doMock('../../../store', () => storeModule);
  jest.doMock('../../../hooks/use-imperative-api', () => imperativeApiModule);
  let moduleV2: typeof GraphProviderModule | null = null;
  jest.isolateModules(() => {
    moduleV2 = require('../graph-provider');
  });
  jest.dontMock('react');
  jest.dontMock('react/jsx-runtime');
  jest.dontMock('../../../context');
  jest.dontMock('../../../store');
  jest.dontMock('../../../hooks/use-imperative-api');
  if (!moduleV2) {
    throw new Error('graph-provider re-evaluation failed');
  }
  return moduleV2;
}

type ProviderCells = NonNullable<GraphProviderModule.GraphProviderProps['initialCells']>;

const initialCells: ProviderCells = [
  {
    id: 'e1',
    type: elementModelModule.ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 20, height: 20 },
    data: {},
  },
  {
    id: 'e2',
    type: elementModelModule.ELEMENT_MODEL_TYPE,
    position: { x: 60, y: 0 },
    size: { width: 20, height: 20 },
    data: {},
  },
  { id: 'l1', type: linkModelModule.LINK_MODEL_TYPE, source: { id: 'e1' }, target: { id: 'e2' } },
];

const extraCell: dia.Cell.JSON = {
  id: 'e3',
  type: elementModelModule.ELEMENT_MODEL_TYPE,
  position: { x: 120, y: 0 },
  size: { width: 20, height: 20 },
  data: {},
};

const renderElement: PaperProps['renderElement'] = () =>
  h('rect', { width: 20, height: 20, 'data-testid': 'node' });

const paperProps: PaperProps = { style: { width: 200, height: 200 }, renderElement };

let mountSequence = 0;
let capturedStore: GraphStoreType | null = null;
let measuredCalls: boolean[] = [];

/** The store most recently seen by the probe; throws when none was captured. */
function requireCapturedStore(): GraphStoreType {
  if (!capturedStore) {
    throw new Error('Probe has not captured a graph store yet');
  }
  return capturedStore;
}

/** Reads the context store and renders the live cell count + a mount sentinel. */
function Probe() {
  capturedStore = useGraphStore();
  const [mountId] = React.useState(() => {
    mountSequence += 1;
    return mountSequence;
  });
  useOnElementsMeasured(({ isInitial }) => {
    measuredCalls.push(isInitial);
  });
  const ids = useCellIds();
  return h(
    'div',
    null,
    h('div', { 'data-testid': 'cell-count' }, String(ids.length)),
    h('div', { 'data-testid': 'mount-id' }, String(mountId))
  );
}

function textOf(container: HTMLElement, testId: string): string | undefined {
  return container.querySelector(`[data-testid="${testId}"]`)?.textContent ?? undefined;
}

function countNodes(container: HTMLElement): number {
  return container.querySelectorAll('[data-testid="node"]').length;
}

async function renderDiagram(app: ReactModule.FunctionComponent) {
  const rendered = rtl.render(h(app));
  await rtl.waitFor(() => {
    expect(rendered.container.querySelector('svg')).toBeTruthy();
    expect(countNodes(rendered.container)).toBe(2);
    expect(textOf(rendered.container, 'cell-count')).toBe('3');
  });
  return rendered;
}

/** Re-evaluates graph-provider.tsx, registers it into the family and refreshes. */
function hotReloadGraphProvider(): void {
  const graphProviderV2 = requireGraphProviderV2();
  expect(graphProviderV2.GraphProvider).not.toBe(graphProviderV1.GraphProvider);
  refreshRuntime.register(graphProviderV2.GraphProvider, 'GraphProvider');
  rtl.act(() => {
    refreshRuntime.performReactRefresh();
  });
}

beforeEach(() => {
  measuredCalls = [];
});

describe('GraphProvider — Fast Refresh (HMR) of graph-provider.tsx', () => {
  it('keeps the diagram rendered and wired after a hot reload', async () => {
    function App() {
      return h(graphProviderV1.GraphProvider, { initialCells }, h(Paper, paperProps), h(Probe));
    }
    refreshRuntime.register(graphProviderV1.GraphProvider, 'GraphProvider');

    const { container } = await renderDiagram(App);

    const storeBeforeRefresh = requireCapturedStore();
    const mountIdBeforeRefresh = textOf(container, 'mount-id');

    hotReloadGraphProvider();

    // The refresh re-ran GraphProvider's mount effect, destroying the old
    // store and creating a fresh one. The fresh store must be published to
    // consumers…
    await rtl.waitFor(() => {
      expect(capturedStore).not.toBe(storeBeforeRefresh);
    });

    // …the subtree must NOT remount (Fast Refresh preserves component state)…
    expect(textOf(container, 'mount-id')).toBe(mountIdBeforeRefresh);

    // …and the diagram must still be fully rendered.
    await rtl.waitFor(() => {
      expect(countNodes(container)).toBe(2);
      expect(textOf(container, 'cell-count')).toBe('3');
    });

    // The new paper starts its own measurement history, so consumers that
    // fit the canvas on the first pass (`if (isInitial) fit()`) run again.
    expect(measuredCalls.at(-1)).toBe(true);

    // The re-created store is live end-to-end: an imperative graph edit still
    // reaches both the paper (new element view) and subscribed hooks.
    rtl.act(() => {
      requireCapturedStore().graph.addCell(extraCell);
    });
    await rtl.waitFor(() => {
      expect(countNodes(container)).toBe(3);
      expect(textOf(container, 'cell-count')).toBe('4');
    });
  });

  // Regression: the re-created store re-ran `graph.resetCells(initialCells)`
  // on the user's own graph, wiping every edit made since mount.
  it('adopts an external graph without re-seeding it', async () => {
    const externalGraph = new core.dia.Graph(
      {},
      { cellNamespace: storeModule.DEFAULT_CELL_NAMESPACE }
    );
    function App() {
      return h(
        graphProviderV1.GraphProvider,
        { graph: externalGraph, initialCells },
        h(Paper, paperProps),
        h(Probe)
      );
    }
    refreshRuntime.register(graphProviderV1.GraphProvider, 'GraphProvider');

    const { container } = await renderDiagram(App);

    rtl.act(() => {
      externalGraph.addCell(extraCell);
    });
    await rtl.waitFor(() => {
      expect(textOf(container, 'cell-count')).toBe('4');
    });
    const storeBeforeRefresh = requireCapturedStore();

    hotReloadGraphProvider();

    await rtl.waitFor(() => {
      expect(capturedStore).not.toBe(storeBeforeRefresh);
    });
    expect(requireCapturedStore().graph).toBe(externalGraph);
    expect(externalGraph.getCells().map((cell) => cell.id)).toEqual(['e1', 'e2', 'l1', 'e3']);
    await rtl.waitFor(() => {
      expect(countNodes(container)).toBe(3);
      expect(textOf(container, 'cell-count')).toBe('4');
    });
  });

  // Known gap (see the `react-hmr-paper-view-guard` changeset): a refresh of
  // paper.tsx re-runs <Paper>'s effects, which unfreezes the already removed
  // paper and throws. Not covered by this PR.
  it.todo('keeps the canvas rendered after a hot reload of paper.tsx');
});
