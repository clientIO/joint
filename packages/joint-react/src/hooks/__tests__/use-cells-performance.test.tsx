/* eslint-disable react-perf/jsx-no-new-function-as-prop, react-perf/jsx-no-new-array-as-prop -- render-count test harness; inline props are the point, not a production concern */
/**
 * Real-case correctness + performance-contract tests for the lazy Map-backed
 * cells container. Performance is asserted OBSERVABLY via render counts (which
 * are deterministic), not via timing: the whole point of the refactor is that a
 * drag re-renders O(1) components, not O(n), and does no id-list work.
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useCells } from '../use-cells';
import { useCellIds } from '../use-cell-ids';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { LINK_MODEL_TYPE } from '../../mvc/link-model';
import type { CellId, CellRecord } from '../../types/cell.types';

const makeElement = (id: string, x = 0): CellRecord =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x, y: 0 },
    size: { width: 10, height: 10 },
  }) as CellRecord;

const makeLink = (id: string, source: string, target: string): CellRecord =>
  ({ id, type: LINK_MODEL_TYPE, source: { id: source }, target: { id: target } }) as CellRecord;

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

let storeRef: ReturnType<typeof useGraphStore> | undefined;
function StoreProbe() {
  storeRef = useGraphStore();
  return null;
}

/** Re-renders (and counts) only when its own cell's position changes. */
function CellPositionProbe({ id, onRender }: { readonly id: string; readonly onRender: () => void }) {
  useCells(id, (cell) => (cell as CellRecord | undefined)?.position?.x ?? -1);
  onRender();
  return null;
}

/** Re-renders (and counts) only when the id SET changes (add/remove). */
function IdListProbe({ onRender }: { readonly onRender: () => void }) {
  useCellIds();
  onRender();
  return null;
}

describe('cells container — real-case fine-grained render behaviour (O(1) drag)', () => {
  beforeEach(() => {
    storeRef = undefined;
  });

  it('dragging one cell re-renders ONLY that cell — not siblings, not the id list', async () => {
    const renders = { a: 0, b: 0, c: 0, list: 0 };
    await act(async () => {
      render(
        <GraphProvider initialCells={[makeElement('a', 0), makeElement('b', 50), makeElement('c', 100)]}>
          <StoreProbe />
          <CellPositionProbe id="a" onRender={() => (renders.a += 1)} />
          <CellPositionProbe id="b" onRender={() => (renders.b += 1)} />
          <CellPositionProbe id="c" onRender={() => (renders.c += 1)} />
          <IdListProbe onRender={() => (renders.list += 1)} />
        </GraphProvider>
      );
      await flush();
    });
    const base = { ...renders };

    // A drag: change only cell 'a'.
    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 999, y: 0 });
      await flush();
    });

    expect(renders.a).toBeGreaterThan(base.a); // the dragged cell re-rendered
    expect(renders.b).toBe(base.b); // sibling did NOT (per-id subscription)
    expect(renders.c).toBe(base.c); // sibling did NOT
    expect(renders.list).toBe(base.list); // id list did NOT (data-only → getIds stable)
  });

  it('a data-only drag does no id-list re-render even across many frames', async () => {
    const renders = { list: 0 };
    await act(async () => {
      render(
        <GraphProvider initialCells={[makeElement('a', 0), makeElement('b', 50)]}>
          <StoreProbe />
          <IdListProbe onRender={() => (renders.list += 1)} />
        </GraphProvider>
      );
      await flush();
    });
    const base = renders.list;

    for (let frame = 1; frame <= 10; frame++) {
      await act(async () => {
        storeRef!.graph.getCell('a')?.set('position', { x: frame, y: 0 });
        await flush();
      });
    }
    // 10 drag frames → zero id-list re-renders (the O(1) property).
    expect(renders.list).toBe(base);
  });

  it('adding a cell re-renders the id list but NOT the existing per-id subscribers', async () => {
    const renders = { a: 0, list: 0 };
    await act(async () => {
      render(
        <GraphProvider initialCells={[makeElement('a', 0)]}>
          <StoreProbe />
          <CellPositionProbe id="a" onRender={() => (renders.a += 1)} />
          <IdListProbe onRender={() => (renders.list += 1)} />
        </GraphProvider>
      );
      await flush();
    });
    const base = { ...renders };

    await act(async () => {
      storeRef!.graph.addCell(makeElement('d', 200));
      await flush();
    });

    expect(renders.list).toBeGreaterThan(base.list); // structural change → id list re-renders
    expect(renders.a).toBe(base.a); // unaffected cell did NOT re-render
  });
});

describe('cells container — real-graph correctness (getIds/getSnapshot never tear)', () => {
  beforeEach(() => {
    storeRef = undefined;
  });

  it('a new link swept in by a moved element (changed bucket) still appears in getIds', async () => {
    await act(async () => {
      render(
        <GraphProvider initialCells={[makeElement('a', 0), makeElement('b', 100)]}>
          <StoreProbe />
        </GraphProvider>
      );
      await flush();
    });

    // Move an element AND add a link connecting it in the SAME tick — this routes
    // the new link through the `changed` bucket (connected-links sweep) rather
    // than `added`. getIds() must not go stale relative to getSnapshot().
    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 5, y: 5 });
      storeRef!.graph.addCell(makeLink('l1', 'a', 'b'));
      await flush();
    });

    const container = storeRef!.graphProjection.cells;
    const ids = container.getIds();
    const snapshotIds = container.getSnapshot().map((cell) => cell.id as CellId);
    expect(ids).toContain('l1'); // the fixed bug: getIds must include the new link
    expect(snapshotIds).toContain('l1');
    // The two views agree — no tearing.
    expect(new Set(ids)).toEqual(new Set(snapshotIds));
    expect(container.has('l1')).toBe(true);
  });

  it('whole-list consumers within one commit share the same snapshot reference', async () => {
    await act(async () => {
      render(
        <GraphProvider initialCells={[makeElement('a', 0), makeElement('b', 100)]}>
          <StoreProbe />
        </GraphProvider>
      );
      await flush();
    });
    const container = storeRef!.graphProjection.cells;
    // Two independent reads after the same commit return the identical array.
    expect(container.getSnapshot()).toBe(container.getSnapshot());
  });
});
