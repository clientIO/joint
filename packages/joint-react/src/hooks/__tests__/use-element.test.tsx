import React from 'react';
import { render } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { CellIdContext } from '../../context';
import { useElement } from '../use-element';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { Cells, CellRecord, ElementRecord } from '../../types/cell.types';

const INITIAL: Cells = [
  {
    id: 'el',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 10, y: 20 },
    size: { width: 30, height: 40 },
    data: { label: 'hi' },
  } as CellRecord,
  {
    id: 'cylinder',
    type: 'standard.Cylinder',
    position: { x: 200, y: 200 },
    size: { width: 80, height: 120 },
    data: { label: 'db' },
  } as CellRecord,
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
  } as CellRecord,
];

interface ReadRecordProps {
  readonly onRead: (value: unknown) => void;
}

interface ReadSelectedProps extends ReadRecordProps {
  readonly selector: (element: ElementRecord) => unknown;
}

function ReadElementRecord({ onRead }: ReadRecordProps) {
  const value = useElement();
  onRead(value);
  return null;
}

function ReadElementSelected({ onRead, selector }: ReadSelectedProps) {
  const value = useElement(selector);
  onRead(value);
  return null;
}

const NOOP_READ = () => {};
const selectWidth = (element: ElementRecord) => element.size?.width;

let capturedValue: unknown;
const captureValue = (value: unknown) => {
  capturedValue = value;
};

describe('useElement', () => {
  it('returns the full element record when context is provided', () => {
    capturedValue = undefined;
    render(
      <GraphProvider initialCells={INITIAL}>
        <CellIdContext.Provider value="el">
          <ReadElementRecord onRead={captureValue} />
        </CellIdContext.Provider>
      </GraphProvider>
    );
    const rec = capturedValue as ElementRecord<{ label: string }>;
    expect(rec.id).toBe('el');
    expect(rec.type).toBe(ELEMENT_MODEL_TYPE);
    expect(rec.data?.label).toBe('hi');
  });

  it('supports a selector', () => {
    capturedValue = undefined;
    render(
      <GraphProvider initialCells={INITIAL}>
        <CellIdContext.Provider value="el">
          <ReadElementSelected onRead={captureValue} selector={selectWidth} />
        </CellIdContext.Provider>
      </GraphProvider>
    );
    expect(capturedValue).toBe(30);
  });

  it('throws when used outside CellIdContext', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={INITIAL}>
          <ReadElementRecord onRead={NOOP_READ} />
        </GraphProvider>
      )
    ).toThrow();
    spy.mockRestore();
  });

  it('accepts custom element subclasses registered in the cell namespace', () => {
    // Regression: useElement used to reject any cell whose `type` wasn't
    // literally ELEMENT_MODEL_TYPE, breaking stories that use built-in
    // JointJS shapes (e.g. 'standard.Cylinder') or custom element types
    // like 'PortsElement'. Classification must route through the graph's
    // type registry — same rule as `mapCellToAttributes`.
    capturedValue = undefined;
    render(
      <GraphProvider initialCells={INITIAL}>
        <CellIdContext.Provider value="cylinder">
          <ReadElementRecord onRead={captureValue} />
        </CellIdContext.Provider>
      </GraphProvider>
    );
    const rec = capturedValue as ElementRecord<{ label: string }>;
    expect(rec.id).toBe('cylinder');
    expect(rec.type).toBe('standard.Cylinder');
    expect(rec.data?.label).toBe('db');
  });

  it('throws when the current id is not an element', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={INITIAL}>
          <CellIdContext.Provider value="l">
            <ReadElementRecord onRead={NOOP_READ} />
          </CellIdContext.Provider>
        </GraphProvider>
      )
    ).toThrow();
    spy.mockRestore();
  });
});
