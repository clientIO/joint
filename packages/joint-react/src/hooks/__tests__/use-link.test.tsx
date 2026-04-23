import React from 'react';
import { render } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { CellIdContext } from '../../context';
import { useLink } from '../use-link';
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
