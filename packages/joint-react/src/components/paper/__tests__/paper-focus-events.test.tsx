/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { render, waitFor, fireEvent } from '@testing-library/react';
import { Paper } from '../paper';
import { GraphProvider } from '../../graph/graph-provider';
import { useOnPaperEvents } from '../../../hooks/use-on-paper-events';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import type { CellRecord } from '../../../types/cell.types';

const CELLS = [
  { id: 'n1', type: ELEMENT_MODEL_TYPE, size: { width: 50, height: 50 } },
] satisfies readonly CellRecord[];

const renderRect = () => <rect />;

/** The cell's portal group carries a `tabindex`, i.e. a focusable node. */
function focusableInCell(container: HTMLElement): Element {
  const node = container.querySelector('.joint-cell [tabindex]');
  if (!node) throw new Error('expected a focusable node inside the cell');
  return node;
}

describe('Paper focus events', () => {
  it('fires onCellFocus / onCellBlur with the cell id', async () => {
    const focus = jest.fn();
    const blur = jest.fn();
    const { container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper
          style={{ width: 200, height: 200 }}
          renderElement={renderRect}
          onCellFocus={focus}
          onCellBlur={blur}
        />
      </GraphProvider>
    );
    await waitFor(() => expect(container.querySelector('.joint-cell')).toBeTruthy());
    const node = focusableInCell(container);

    fireEvent.focusIn(node);
    fireEvent.focusOut(node);

    await waitFor(() => {
      expect(focus).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }));
      expect(blur).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }));
    });
  });

  it('is exposed through the paper events API (useOnPaperEvents)', async () => {
    const focus = jest.fn();
    function FocusLogger() {
      useOnPaperEvents({ onCellFocus: focus });
      return null;
    }
    const { container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper style={{ width: 200, height: 200 }} renderElement={renderRect} />
        <FocusLogger />
      </GraphProvider>
    );
    await waitFor(() => expect(container.querySelector('.joint-cell')).toBeTruthy());

    fireEvent.focusIn(focusableInCell(container));

    await waitFor(() =>
      expect(focus).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }))
    );
  });
});
