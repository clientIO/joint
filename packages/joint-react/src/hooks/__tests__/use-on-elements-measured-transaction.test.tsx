import { util } from '@joint/core';
import { act, render, waitFor } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper/paper';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellId, CellRecord } from '../../types/cell.types';
import type { GraphStore } from '../../store';
import { useGraphStore } from '../use-graph-store';
import { useGraphTransaction, type Transaction } from '../use-graph-transaction';
import { useOnElementsMeasured } from '../use-on-elements-measured';

const PAPER_ID = 'measurement-transaction';
const PAPER_STYLE = { width: 100, height: 100 };
const INITIAL_CELLS: readonly CellRecord[] = ['a', 'b', 'c'].map((id) => ({
  id,
  type: ELEMENT_MODEL_TYPE,
  position: { x: 0, y: 0 },
  size: { width: 50, height: 50 },
}));
const renderElement = () => <rect width={50} height={50} />;

/** Flushes scheduled delivery while an asynchronous transaction stays open. */
const flush = () => act(async () => new Promise<void>((resolve) => setTimeout(resolve, 0)));

function deferred() {
  let release: () => void = util.noop;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

async function renderGraph() {
  const captured: { store?: GraphStore; transaction?: Transaction } = {};
  const events: CellId[][] = [];

  function Probe() {
    const currentStore = useGraphStore();
    captured.store = currentStore;
    captured.transaction = useGraphTransaction();
    useOnElementsMeasured(PAPER_ID, () => {
      const snapshot = currentStore.graphProjection.cells.getSnapshot();
      events.push(snapshot.flatMap(({ id }) => (id === undefined ? [] : [id])));
    });
    return null;
  }

  render(
    <GraphProvider initialCells={INITIAL_CELLS}>
      <Paper id={PAPER_ID} style={PAPER_STYLE} renderElement={renderElement} />
      <Probe />
    </GraphProvider>
  );
  await waitFor(() => expect(events).toHaveLength(1));
  await flush();
  events.length = 0;
  const { store, transaction } = captured;
  if (!store || !transaction) throw new Error('graph not ready');
  return { store, transaction, events };
}

describe('useOnElementsMeasured with deferred transactions', () => {
  it('delivers once after an async removal commits its cells', async () => {
    const { store, transaction, events } = await renderGraph();
    const gate = deferred();
    let completion: Promise<void> | undefined;
    await act(async () => {
      completion = transaction(async () => {
        store.graph.getCell('a').remove();
        await gate.promise;
      });
    });
    await flush();
    const deliveriesWhileOpen = [...events];
    await act(async () => {
      gate.release();
      await completion;
    });
    await flush();

    expect(deliveriesWhileOpen).toEqual([]);
    expect(events).toEqual([['b', 'c']]);
    expect(store.graphProjection.cells.has('a')).toBe(false);
  });

  it('waits for the outermost deferred transaction after a nested one closes', async () => {
    const { store, transaction, events } = await renderGraph();
    const innerGate = deferred();
    const outerGate = deferred();
    let completion: Promise<void> | undefined;
    await act(async () => {
      completion = transaction(async () => {
        store.graph.getCell('a').remove();
        await transaction(async () => {
          store.graph.getCell('b').remove();
          await innerGate.promise;
        });
        await outerGate.promise;
      });
    });
    await flush();
    const deliveriesWithBothOpen = [...events];
    await act(async () => {
      innerGate.release();
    });
    await flush();
    const deliveriesWithOuterOpen = [...events];
    await act(async () => {
      outerGate.release();
      await completion;
    });
    await flush();

    expect(deliveriesWithBothOpen).toEqual([]);
    expect(deliveriesWithOuterOpen).toEqual([]);
    expect(events).toEqual([['c']]);
  });

  it('keeps ordinary batches live before their batch stop', async () => {
    const { store, events } = await renderGraph();
    act(() => {
      store.graph.startBatch('live-layout');
      store.graph.getCell('a').remove();
    });
    await flush();
    const deliveriesWhileOpen = [...events];
    act(() => {
      store.graph.stopBatch('live-layout');
    });
    await flush();

    expect(deliveriesWhileOpen).toEqual([['b', 'c']]);
    expect(events).toEqual([['b', 'c']]);
  });

  it('waits for an enclosing ordinary batch to commit a deferred inner transaction', async () => {
    const { store, transaction, events } = await renderGraph();
    const gate = deferred();
    let completion: Promise<void> | undefined;
    await act(async () => {
      store.graph.startBatch('outer-layout');
      completion = transaction(async () => {
        store.graph.getCell('a').remove();
        await gate.promise;
      });
    });
    await flush();
    await act(async () => {
      gate.release();
      await completion;
    });
    await flush();
    const deliveriesWithOuterOpen = [...events];
    act(() => {
      store.graph.stopBatch('outer-layout');
    });
    await flush();

    expect(deliveriesWithOuterOpen).toEqual([]);
    expect(events).toEqual([['b', 'c']]);
  });
});
