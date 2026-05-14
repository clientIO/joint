import React from 'react';
import { type dia, mvc, shapes } from '@joint/core';
import { renderHook, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useSetCellCollection } from '../use-set-cell-collection';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE, ElementModel } from '../../models/element-model';
import { LinkModel } from '../../models/link-model';
import type { CellRecord, Computed } from '../../types/cell.types';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const initialCells: readonly CellRecord[] = [
  { id: 'a', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
  { id: 'b', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
];

// Module-scoped components so tests don't define nested components inside `it` blocks.
let graphRef: dia.Graph | undefined;
function GraphProbe(): null {
  graphRef = useGraphStore().graph;
  return null;
}

interface WrapperProps {
  readonly children: React.ReactNode;
}
function Wrapper({ children }: Readonly<WrapperProps>) {
  return <GraphProvider initialCells={initialCells}>{children}</GraphProvider>;
}

describe('useSetCellCollection', () => {
  it('returns a stable no-op when collection is undefined', async () => {
    const { result } = renderHook(() => useSetCellCollection(), { wrapper: Wrapper });
    await flush();
    expect(() => {
      act(() => {
        result.current([
          { id: 'x', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as unknown as Computed<CellRecord>,
        ]);
      });
    }).not.toThrow();
  });

  it('setter becomes effective once a previously-undefined collection arrives', async () => {
    // eslint-disable-next-line prefer-const
    let collection: mvc.Collection<dia.Cell> | undefined;
    let setter: ReturnType<typeof useSetCellCollection> | undefined;

    const { rerender } = renderHook(
      () => {
        setter = useSetCellCollection(collection);
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      },
    );
    await flush();

    // While undefined: invoking the setter is a no-op.
    act(() => {
      setter!([
        { id: 'a', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as unknown as Computed<CellRecord>,
      ]);
    });
    await flush();
    expect(collection).toBeUndefined();

    // Collection becomes available — setter starts mutating it.
    collection = new mvc.Collection<dia.Cell>([]);
    rerender();
    await flush();

    act(() => {
      setter!([
        { id: 'a', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as unknown as Computed<CellRecord>,
      ]);
    });
    await flush();
    expect(collection!.length).toBe(1);
    expect(collection!.at(0)).toBe(graphRef!.getCell('a'));
  });

  it('resets the collection with cells from the graph when records have matching ids', async () => {
    let setter: ReturnType<typeof useSetCellCollection> | undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;

    renderHook(
      () => {
        if (!graphRef) return;
        if (!collection) collection = new mvc.Collection<dia.Cell>([]);
        setter = useSetCellCollection(collection);
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      }
    );
    await flush();

    act(() => {
      setter!([
        { id: 'a', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
      ]);
    });
    await flush();

    expect(collection!.length).toBe(1);
    expect(collection!.at(0)).toBe(graphRef!.getCell('a'));
  });

  it('supports the updater form', async () => {
    let setter: ReturnType<typeof useSetCellCollection> | undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;

    renderHook(
      () => {
        if (!graphRef) return;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([
            graphRef.getCell('a')!,
            graphRef.getCell('b')!,
          ]);
        }
        setter = useSetCellCollection(collection);
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      }
    );
    await flush();
    expect(collection!.length).toBe(2);

    act(() => {
      setter!((previous) => previous.slice(0, 1));
    });
    await flush();
    expect(collection!.length).toBe(1);
    expect(collection!.at(0)!.id).toBe('a');
  });

  it('constructs a new model when a record id has no matching graph cell', async () => {
    let setter: ReturnType<typeof useSetCellCollection> | undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;

    renderHook(
      () => {
        if (!graphRef) return;
        if (!collection) collection = new mvc.Collection<dia.Cell>([]);
        setter = useSetCellCollection(collection);
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      }
    );
    await flush();

    act(() => {
      setter!([
        {
          id: 'fresh',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ]);
    });
    await flush();

    expect(collection!.length).toBe(1);
    expect(graphRef!.getCell('fresh')).toBeFalsy();
    expect(collection!.at(0)!.id).toBe('fresh');
  });

  it('accepts a dia.Cell instance directly in the setter', async () => {
    let setter: ReturnType<typeof useSetCellCollection> | undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;

    renderHook(
      () => {
        if (!graphRef) return;
        if (!collection) collection = new mvc.Collection<dia.Cell>([]);
        setter = useSetCellCollection(collection);
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      }
    );
    await flush();

    const diaElement = new ElementModel({
      id: 'dia-col',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    act(() => {
      setter!([diaElement as unknown as Computed<CellRecord>]);
    });
    await flush();

    expect(collection!.length).toBe(1);
    expect(collection!.at(0)).toBe(diaElement);
  });

  it('accepts a shapes.standard.Rectangle in the setter', async () => {
    let setter: ReturnType<typeof useSetCellCollection> | undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;

    renderHook(
      () => {
        if (!graphRef) return;
        if (!collection) collection = new mvc.Collection<dia.Cell>([]);
        setter = useSetCellCollection(collection);
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      }
    );
    await flush();

    const rect = new shapes.standard.Rectangle({
      id: 'std-rect',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
    });
    act(() => {
      setter!([rect as unknown as Computed<CellRecord>]);
    });
    await flush();

    expect(collection!.length).toBe(1);
    expect(collection!.at(0)).toBe(rect);
    expect(collection!.at(0)!.get('type')).toBe('standard.Rectangle');
  });

  it('accepts a mix of records and dia.Cell instances', async () => {
    let setter: ReturnType<typeof useSetCellCollection> | undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;

    renderHook(
      () => {
        if (!graphRef) return;
        if (!collection) collection = new mvc.Collection<dia.Cell>([]);
        setter = useSetCellCollection(collection);
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      }
    );
    await flush();

    const diaLink = new LinkModel({
      id: 'dia-link',
      source: { id: 'a' },
      target: { id: 'b' },
    });
    act(() => {
      setter!([
        { id: 'a', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
        diaLink as unknown as Computed<CellRecord>,
      ]);
    });
    await flush();

    expect(collection!.length).toBe(2);
    expect(collection!.at(0)!.id).toBe('a');
    expect(collection!.at(1)).toBe(diaLink);
  });

  it('accepts dia.Cell instances from the updater form', async () => {
    let setter: ReturnType<typeof useSetCellCollection> | undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;

    renderHook(
      () => {
        if (!graphRef) return;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([graphRef.getCell('a')!]);
        }
        setter = useSetCellCollection(collection);
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      }
    );
    await flush();
    expect(collection!.length).toBe(1);

    const newElement = new ElementModel({
      id: 'updater-dia',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    act(() => {
      setter!((previous) => [...previous, newElement as unknown as Computed<CellRecord>]);
    });
    await flush();

    expect(collection!.length).toBe(2);
    expect(collection!.at(1)).toBe(newElement);
  });

  it('constructs the correct type when using a custom type record', async () => {
    let setter: ReturnType<typeof useSetCellCollection> | undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;

    renderHook(
      () => {
        if (!graphRef) return;
        if (!collection) collection = new mvc.Collection<dia.Cell>([]);
        setter = useSetCellCollection(collection);
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      }
    );
    await flush();

    act(() => {
      setter!([
        {
          id: 'custom-rect',
          type: 'standard.Rectangle',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
        } as unknown as Computed<CellRecord>,
      ]);
    });
    await flush();

    expect(collection!.length).toBe(1);
    const model = collection!.at(0)!;
    expect(model.get('type')).toBe('standard.Rectangle');
    expect(model.isElement()).toBe(true);
  });
});
