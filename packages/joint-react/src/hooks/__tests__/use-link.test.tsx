import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { CellIdContext } from '../../context';
import { useLink } from '../use-link';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { Cells, CellRecord, LinkRecord } from '../../types/cell.types';

const INITIAL: Cells = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
  } as CellRecord,
  {
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 50, y: 0 },
    size: { width: 10, height: 10 },
  } as CellRecord,
  {
    id: 'l',
    type: LINK_MODEL_TYPE,
    source: { id: 'a' },
    target: { id: 'b' },
    data: { weight: 42 },
  } as CellRecord,
];

type ReadCallback = (value: unknown) => void;
type Selector = (link: LinkRecord) => unknown;

function ProbeFull({ onRead }: { readonly onRead: ReadCallback }) {
  const value = useLink();
  onRead(value);
  return null;
}

function ProbeWithSelector({
  onRead,
  selector,
}: {
  readonly onRead: ReadCallback;
  readonly selector: Selector;
}) {
  const value = useLink(selector);
  onRead(value);
  return null;
}

const pickSource: Selector = (link) => link.source;
const noop: ReadCallback = () => {};

let capturedValue: unknown;
const captureValue: ReadCallback = (value) => {
  capturedValue = value;
};

describe('useLink', () => {
  it('returns the full link record when context is provided', () => {
    capturedValue = undefined;
    render(
      <GraphProvider initialCells={INITIAL}>
        <CellIdContext.Provider value="l">
          <ProbeFull onRead={captureValue} />
        </CellIdContext.Provider>
      </GraphProvider>
    );
    const rec = capturedValue as LinkRecord<{ weight: number }>;
    expect(rec.id).toBe('l');
    expect(rec.type).toBe(LINK_MODEL_TYPE);
    expect(rec.data?.weight).toBe(42);
  });

  it('supports a selector', () => {
    capturedValue = undefined;
    render(
      <GraphProvider initialCells={INITIAL}>
        <CellIdContext.Provider value="l">
          <ProbeWithSelector onRead={captureValue} selector={pickSource} />
        </CellIdContext.Provider>
      </GraphProvider>
    );
    expect(capturedValue).toEqual({ id: 'a' });
  });

  it('throws when used outside CellIdContext', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={INITIAL}>
          <ProbeFull onRead={noop} />
        </GraphProvider>
      )
    ).toThrow();
    spy.mockRestore();
  });

  it('throws when the current id is not a link', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={INITIAL}>
          <CellIdContext.Provider value="a">
            <ProbeFull onRead={noop} />
          </CellIdContext.Provider>
        </GraphProvider>
      )
    ).toThrow();
    spy.mockRestore();
  });
});

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
function plainWrapper({ children }: { readonly children: React.ReactNode }) {
  return <GraphProvider initialCells={INITIAL}>{children}</GraphProvider>;
}

describe('useLink (id argument form)', () => {
  it('returns the link record for an explicit id without needing context', async () => {
    const { result } = renderHook(() => useLink('l'), { wrapper: plainWrapper });
    await act(async () => flush());
    expect(result.current.id).toBe('l');
    expect(result.current.type).toBe(LINK_MODEL_TYPE);
  });

  it('selector form returns selected slice', async () => {
    const { result } = renderHook(() => useLink('l', (link) => link.target), {
      wrapper: plainWrapper,
    });
    await act(async () => flush());
    expect(result.current).toEqual({ id: 'b' });
  });

  it('throws when explicit id is an element', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useLink('a'), { wrapper: plainWrapper })).toThrow();
    spy.mockRestore();
  });

  it('selector returning a fresh array does not infinite-loop', async () => {
    const { result } = renderHook(
      () => useLink('l', (link) => [link.id, link.type]),
      { wrapper: plainWrapper }
    );
    await act(async () => flush());
    expect(result.current).toEqual(['l', LINK_MODEL_TYPE]);
  });

  it('subscribes only to the requested id — unrelated cells do not re-render', async () => {
    const renderSpy = jest.fn();
    let storeRef!: ReturnType<typeof useGraphStore>;
    function Probe() {
      storeRef = useGraphStore();
      return null;
    }
    function Consumer() {
      const link = useLink('l');
      renderSpy(link.id);
      return null;
    }
    renderHook(() => null, {
      wrapper: ({ children }) => (
        <GraphProvider initialCells={INITIAL}>
          <Probe />
          <Consumer />
          {children}
        </GraphProvider>
      ),
    });
    await act(async () => flush());
    const before = renderSpy.mock.calls.length;
    await act(async () => {
      storeRef.graph.getCell('a')?.set('position', { x: 99, y: 99 });
      await flush();
    });
    expect(renderSpy.mock.calls.length).toBe(before);
  });
});
