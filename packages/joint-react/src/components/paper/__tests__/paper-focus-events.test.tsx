/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { render, waitFor, fireEvent } from '@testing-library/react';
import { Paper } from '../paper';
import { GraphProvider } from '../../graph/graph-provider';
import { useOnPaperEvents } from '../../../hooks/use-on-paper-events';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import { LINK_MODEL_TYPE } from '../../../mvc/link-model';
import type { CellRecord } from '../../../types/cell.types';

const CELLS = [
  { id: 'n1', type: ELEMENT_MODEL_TYPE, size: { width: 50, height: 50 } },
] satisfies readonly CellRecord[];

const LINKED_CELLS = [
  { id: 'n1', type: ELEMENT_MODEL_TYPE, size: { width: 50, height: 50 } },
  { id: 'n2', type: ELEMENT_MODEL_TYPE, position: { x: 100, y: 0 }, size: { width: 50, height: 50 } },
  { id: 'l1', type: LINK_MODEL_TYPE, source: { id: 'n1' }, target: { id: 'n2' } } as CellRecord,
];

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

  it('fires the element and link variants with the cell id', async () => {
    const elementFocus = jest.fn();
    const elementBlur = jest.fn();
    const linkFocus = jest.fn();
    const linkBlur = jest.fn();
    const { container } = render(
      <GraphProvider initialCells={LINKED_CELLS}>
        <Paper
          style={{ width: 200, height: 200 }}
          renderElement={renderRect}
          onElementFocus={elementFocus}
          onElementBlur={elementBlur}
          onLinkFocus={linkFocus}
          onLinkBlur={linkBlur}
        />
      </GraphProvider>
    );
    await waitFor(() => expect(container.querySelector('.joint-link')).toBeTruthy());

    fireEvent.focusIn(focusableInCell(container));
    fireEvent.focusOut(focusableInCell(container));

    const link = container.querySelector('.joint-link') as Element;
    fireEvent.focusIn(link);
    fireEvent.focusOut(link);

    await waitFor(() => {
      expect(elementFocus).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }));
      expect(elementBlur).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }));
      expect(linkFocus).toHaveBeenCalledWith(expect.objectContaining({ id: 'l1' }));
      expect(linkBlur).toHaveBeenCalledWith(expect.objectContaining({ id: 'l1' }));
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
