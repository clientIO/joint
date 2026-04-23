import React from 'react';
import { render } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { CellIdContext } from '../../context';
import { useCell } from '../use-cell';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import type { Cells, CellRecord } from '../../types/cell.types';

const initialCells: Cells = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
    data: { label: 'A' },
  } as CellRecord,
];

function ReadCell({ onRead }: { readonly onRead: (cell: CellRecord) => void }) {
  const cell = useCell();
  onRead(cell);
  return null;
}

const NOOP_READ: (cell: CellRecord) => void = () => {};

interface CaptureState {
  cell: CellRecord | undefined;
}
const captureState: CaptureState = { cell: undefined };
function captureCell(cell: CellRecord) {
  captureState.cell = cell;
}
function resetCapturedCell() {
  captureState.cell = undefined;
}

describe('useCell', () => {
  it('throws when used outside CellIdContext', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={initialCells}>
          <ReadCell onRead={NOOP_READ} />
        </GraphProvider>
      )
    ).toThrow();
    spy.mockRestore();
  });

  it('returns the cell record when wrapped in CellIdContext', () => {
    resetCapturedCell();
    render(
      <GraphProvider initialCells={initialCells}>
        <CellIdContext.Provider value="a">
          <ReadCell onRead={captureCell} />
        </CellIdContext.Provider>
      </GraphProvider>
    );
    expect(captureState.cell?.id).toBe('a');
    expect(captureState.cell?.type).toBe(ELEMENT_MODEL_TYPE);
  });

  it('throws when the id is missing from the store', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={initialCells}>
          <CellIdContext.Provider value="does-not-exist">
            <ReadCell onRead={NOOP_READ} />
          </CellIdContext.Provider>
        </GraphProvider>
      )
    ).toThrow();
    spy.mockRestore();
  });
});
