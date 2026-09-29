/* eslint-disable sonarjs/no-element-overwrite -- tests set the same position key repeatedly on purpose */
/* eslint-disable sonarjs/no-nested-functions -- act(async () => transaction(() => ...)) nests intentionally */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components';
import { useGraph } from '../use-graph';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord } from '../../types/cell.types';
import type { GraphStore } from '../../store';
import type { Transaction } from '../use-graph-transaction';

const makeElement = (id: string, x = 0, y = 0): CellRecord =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x, y },
    size: { width: 10, height: 10 },
    data: { label: 'a', nested: { count: 0 } },
  }) as CellRecord;

const initialCells: readonly CellRecord[] = [makeElement('a', 0, 0)];

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

let transactionRef: Transaction | undefined;
let storeRef: GraphStore | undefined;

function Api() {
  transactionRef = useGraph().transaction;
  storeRef = useGraphStore();
  return null;
}

const cellA = () => storeRef!.graph.getCell('a')!;
const positionOf = (id: string) => storeRef!.graph.getCell(id)?.get('position');
const sizeOf = (id: string) => storeRef!.graph.getCell(id)?.get('size');
const dataOf = (id: string) => storeRef!.graph.getCell(id)?.get('data');
const countCommits = () => {
  let commits = 0;
  const unsubscribe = storeRef!.graphProjection.cells.subscribe(() => {
    commits += 1;
  });
  return { get: () => commits, unsubscribe };
};

beforeEach(() => {
  transactionRef = undefined;
  storeRef = undefined;
});

async function renderUncontrolled() {
  render(
    <GraphProvider initialCells={initialCells}>
      <Api />
    </GraphProvider>
  );
  await waitFor(() => expect(transactionRef).toBeDefined());
  await act(async () => flush());
}

describe('useGraph().transaction', () => {
  it('collapses many synchronous edits into a single store commit (one re-render)', async () => {
    await renderUncontrolled();

    // One commit fires the subscribers once → React schedules one re-render.
    // (Counting commits is StrictMode-proof, unlike raw render counts.)
    let commits = 0;
    const unsubscribe = storeRef!.graphProjection.cells.subscribe(() => {
      commits += 1;
    });

    await act(async () => {
      transactionRef!(() => {
        const cell = storeRef!.graph.getCell('a')!;
        cell.set('position', { x: 1, y: 1 });
        cell.set('position', { x: 2, y: 2 });
        cell.set('position', { x: 3, y: 3 });
      });
      await flush();
    });
    unsubscribe();

    expect(commits).toBe(1);
    expect(positionOf('a')).toEqual({ x: 3, y: 3 });
  });

  it('returns the callback result for sync callbacks', async () => {
    await renderUncontrolled();
    expect(transactionRef!(() => 42)).toBe(42);
  });

  it('rolls back a changed position when the callback throws', async () => {
    await renderUncontrolled();
    expect(positionOf('a')).toEqual({ x: 0, y: 0 });

    await act(async () => {
      expect(() =>
        transactionRef!(
          () => {
            storeRef!.graph.getCell('a')!.set('position', { x: 999, y: 999 });
            throw new Error('boom');
          },
          { rollbackOnError: true }
        )
      ).toThrow('boom');
      await flush();
    });

    // Restored on both the graph and the reactive container.
    expect(positionOf('a')).toEqual({ x: 0, y: 0 });
    expect(storeRef!.graphProjection.cells.get('a')?.position).toEqual({ x: 0, y: 0 });
  });

  it('keeps partial edits by default (rollbackOnError off)', async () => {
    await renderUncontrolled();

    await act(async () => {
      expect(() =>
        transactionRef!(() => {
          storeRef!.graph.getCell('a')!.set('position', { x: 5, y: 5 });
          throw new Error('nope');
        })
      ).toThrow('nope');
      await flush();
    });

    expect(positionOf('a')).toEqual({ x: 5, y: 5 });
  });

  it('awaits an async callback and commits both edits', async () => {
    await renderUncontrolled();

    await act(async () => {
      await transactionRef!(async () => {
        storeRef!.graph.getCell('a')!.set('position', { x: 7, y: 7 });
        await flush();
        storeRef!.graph.getCell('a')!.set('position', { x: 8, y: 8 });
      });
    });

    expect(positionOf('a')).toEqual({ x: 8, y: 8 });
  });

  it('rolls back when an async callback rejects', async () => {
    await renderUncontrolled();

    await act(async () => {
      await expect(
        transactionRef!(
          async () => {
            storeRef!.graph.getCell('a')!.set('position', { x: 100, y: 100 });
            await flush();
            throw new Error('async boom');
          },
          { rollbackOnError: true }
        )
      ).rejects.toThrow('async boom');
      await flush();
    });

    expect(positionOf('a')).toEqual({ x: 0, y: 0 });
  });

  it('rolls back a changed size when the callback throws', async () => {
    await renderUncontrolled();
    expect(sizeOf('a')).toEqual({ width: 10, height: 10 });

    await act(async () => {
      expect(() =>
        transactionRef!(
          () => {
            cellA().set('size', { width: 999, height: 999 });
            throw new Error('boom');
          },
          { rollbackOnError: true }
        )
      ).toThrow('boom');
      await flush();
    });

    expect(sizeOf('a')).toEqual({ width: 10, height: 10 });
  });

  it('rolls back a deep data change when the callback throws', async () => {
    await renderUncontrolled();
    expect(dataOf('a')).toEqual({ label: 'a', nested: { count: 0 } });

    await act(async () => {
      expect(() =>
        transactionRef!(
          () => {
            cellA().prop('data/nested/count', 5);
            cellA().prop('data/label', 'changed');
            throw new Error('boom');
          },
          { rollbackOnError: true }
        )
      ).toThrow('boom');
      await flush();
    });

    expect(dataOf('a')).toEqual({ label: 'a', nested: { count: 0 } });
  });

  it('rolls back mixed position/size/deep-data changes when the callback throws', async () => {
    await renderUncontrolled();

    await act(async () => {
      expect(() =>
        transactionRef!(
          () => {
            cellA().set('position', { x: 111, y: 222 });
            cellA().set('size', { width: 333, height: 444 });
            cellA().prop('data/nested/count', 99);
            throw new Error('boom');
          },
          { rollbackOnError: true }
        )
      ).toThrow('boom');
      await flush();
    });

    expect(positionOf('a')).toEqual({ x: 0, y: 0 });
    expect(sizeOf('a')).toEqual({ width: 10, height: 10 });
    expect(dataOf('a')).toEqual({ label: 'a', nested: { count: 0 } });
  });

  it('rolls back as a single store commit (restore flushes with the batch)', async () => {
    await renderUncontrolled();

    const commits = countCommits();
    await act(async () => {
      expect(() =>
        transactionRef!(
          () => {
            cellA().set('position', { x: 111, y: 222 });
            cellA().set('size', { width: 333, height: 444 });
            throw new Error('boom');
          },
          { rollbackOnError: true }
        )
      ).toThrow('boom');
      await flush();
    });
    commits.unsubscribe();

    expect(commits.get()).toBe(1);
    expect(positionOf('a')).toEqual({ x: 0, y: 0 });
    expect(sizeOf('a')).toEqual({ width: 10, height: 10 });
  });

  it('coalesces many delayed async edits into a single React update', async () => {
    await renderUncontrolled();

    const commits = countCommits();
    await act(async () => {
      await transactionRef!(async () => {
        cellA().set('position', { x: 1, y: 1 });
        await delay(1);
        cellA().set('data', { ...cellA().get('data'), label: 'b' });
        await delay(1);
        cellA().set('size', { width: 20, height: 20 });
        await delay(1);
        cellA().prop('data/nested/count', 5);
        await delay(1);
      });
      await flush();
    });
    commits.unsubscribe();

    // One React update for the whole transaction, regardless of the await gaps.
    expect(commits.get()).toBe(1);
    expect(positionOf('a')).toEqual({ x: 1, y: 1 });
    expect(sizeOf('a')).toEqual({ width: 20, height: 20 });
    expect(dataOf('a')).toEqual({ label: 'b', nested: { count: 5 } });
  });
});

async function renderWithPaper() {
  render(
    <GraphProvider initialCells={initialCells}>
      <Api />
      <Paper />
    </GraphProvider>
  );
  await waitFor(() => expect(storeRef).toBeDefined());
  await waitFor(() => expect(storeRef!.paperStores.size).toBeGreaterThan(0));
  await act(async () => flush());
}

const firstPaper = () => [...storeRef!.paperStores.values()][0].paper;
// Count only the transaction's keyed freeze/unfreeze calls, ignoring the paper's own.
const keyedCalls = (spy: jest.SpyInstance) =>
  spy.mock.calls.filter(([opt]) => (opt as { key?: string } | undefined)?.key === 'react/transaction')
    .length;

describe('useGraph().transaction — paper freezing', () => {
  it('freezes every bound paper and unfreezes on close when deferPaint is set', async () => {
    await renderWithPaper();
    const paper = firstPaper();
    const freezeSpy = jest.spyOn(paper, 'freeze');
    const unfreezeSpy = jest.spyOn(paper, 'unfreeze');

    await act(async () => {
      transactionRef!(
        () => {
          cellA().set('position', { x: 5, y: 5 });
        },
        { deferPaint: true }
      );
      await flush();
    });

    expect(keyedCalls(freezeSpy)).toBe(1);
    expect(keyedCalls(unfreezeSpy)).toBe(1);
    freezeSpy.mockRestore();
    unfreezeSpy.mockRestore();
  });

  it('leaves papers live by default', async () => {
    await renderWithPaper();
    const paper = firstPaper();
    const freezeSpy = jest.spyOn(paper, 'freeze');

    await act(async () => {
      transactionRef!(() => {
        cellA().set('position', { x: 9, y: 9 });
      });
      await flush();
    });

    expect(keyedCalls(freezeSpy)).toBe(0);
    freezeSpy.mockRestore();
  });
});

describe('useGraph().transaction — controlled mode', () => {
  it('fires onCellsChange once for a multi-edit transaction', async () => {
    const onCellsChange = jest.fn();

    render(
      <GraphProvider cells={initialCells} onCellsChange={onCellsChange}>
        <Api />
      </GraphProvider>
    );
    await waitFor(() => expect(transactionRef).toBeDefined());
    await act(async () => flush());

    onCellsChange.mockClear();
    await act(async () => {
      transactionRef!(() => {
        const cell = storeRef!.graph.getCell('a')!;
        cell.set('position', { x: 1, y: 1 });
        cell.set('position', { x: 2, y: 2 });
      });
      await flush();
    });

    expect(onCellsChange).toHaveBeenCalledTimes(1);
  });

  it('keeps native React state in sync with a single update for an async transaction', async () => {
    const onCellsChange = jest.fn();
    let latestCells: readonly CellRecord[] = initialCells;

    // Real controlled harness: the parent owns cells via useState.
    function ControlledApp() {
      const [cells, setCells] = React.useState<readonly CellRecord[]>(initialCells);
      const handleChange = React.useCallback((next: readonly CellRecord[]) => {
        onCellsChange();
        latestCells = next;
        setCells(next);
      }, []);
      return (
        <GraphProvider cells={cells} onCellsChange={handleChange}>
          <Api />
        </GraphProvider>
      );
    }

    render(<ControlledApp />);
    await waitFor(() => expect(transactionRef).toBeDefined());
    await act(async () => flush());

    onCellsChange.mockClear();
    const commits = countCommits();
    await act(async () => {
      await transactionRef!(async () => {
        cellA().set('position', { x: 1, y: 1 });
        await delay(1);
        cellA().set('size', { width: 20, height: 20 });
        await delay(1);
        cellA().prop('data/nested/count', 9);
        await delay(1);
      });
      await flush();
    });
    commits.unsubscribe();

    // One store commit and one setCells, despite three await-separated edits.
    expect(commits.get()).toBe(1);
    expect(onCellsChange).toHaveBeenCalledTimes(1);
    const a = latestCells.find((cell) => cell.id === 'a');
    expect(a?.position).toEqual({ x: 1, y: 1 });
    expect(a?.size).toEqual({ width: 20, height: 20 });
    expect(a?.data).toEqual({ label: 'a', nested: { count: 9 } });
  });
});

describe('commit deferral scope', () => {
  it('commits live inside a plain (non-transaction) batch, not only at batch:stop', async () => {
    await renderUncontrolled();

    const commits = countCommits();
    await act(async () => {
      // A plain batch — e.g. what an interactive drag opens. Its edits must
      // commit live so reactive readers/overlays follow the element; otherwise
      // they freeze mid-drag and only snap into place on batch:stop.
      storeRef!.graph.startBatch('drag');
      cellA().set('position', { x: 5, y: 5 });
      await flush();
      expect(commits.get()).toBeGreaterThan(0);
      storeRef!.graph.stopBatch('drag');
    });
    commits.unsubscribe();
  });
});
