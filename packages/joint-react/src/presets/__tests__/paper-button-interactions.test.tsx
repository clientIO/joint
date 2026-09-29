import { useCallback } from 'react';
import { render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { usePaper } from '../../hooks/use-paper';
import type { PaperView } from '../../mvc/paper';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord } from '../../types/cell.types';

// A button inside a node must be clickable AND draggable: dragging it moves the element
// (or starts a link when it sits in a magnet), while a press-and-release in place is just
// a click. joint-core blocks every form control from starting an interaction, so the
// preset narrows `PREVENT_INTERACTION_TAG_NAMES` to leave `BUTTON` out — and `pointerup`
// withholds the native click once the gesture has moved, since a node dragged by its own
// button ends the gesture back on that button and would otherwise fire `onClick`.

const ELEMENT_ID = 'cell-1';

beforeAll(() => {
  // jsdom has no layout, so it ships no `elementFromPoint`; joint-core reaches for it
  // while a drag is in flight (`CellView#getEventTarget`). Nothing here depends on the
  // node it would return.
  document.elementFromPoint = () => null;
});

const initialCells: readonly CellRecord[] = [
  {
    id: ELEMENT_ID,
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 80, height: 40 },
  } as CellRecord,
];

let capturedPaper: PaperView | null = null;
let capturedButton: HTMLButtonElement | null = null;

function Capture() {
  capturedPaper = usePaper().paper;
  return null;
}

const PAPER_STYLE = { width: 200, height: 200 };

/** Reassigned per test, read at render time by the button's `onClick`. */
let onButtonClick: () => void = () => {};

function NodeWithButton() {
  const buttonRef = useCallback((node: HTMLButtonElement | null) => {
    capturedButton = node;
  }, []);
  return (
    <>
      <rect width={80} height={40} fill="#1c2836" />
      <foreignObject width={80} height={40}>
        <button type="button" ref={buttonRef} onClick={onButtonClick}>
          press
        </button>
      </foreignObject>
    </>
  );
}

const renderElement = () => <NodeWithButton />;

/**
 * Mount a paper holding one element whose markup contains a `<button>`.
 * @param clickSpy - Spy for the button's React `onClick`.
 * @returns The paper and the rendered `<button>`.
 */
async function renderNodeWithButton(
  clickSpy: () => void
): Promise<{ paper: PaperView; button: HTMLButtonElement }> {
  capturedPaper = null;
  capturedButton = null;
  onButtonClick = clickSpy;
  render(
    <GraphProvider initialCells={initialCells}>
      <Paper style={PAPER_STYLE} renderElement={renderElement}>
        <Capture />
      </Paper>
    </GraphProvider>
  );
  await waitFor(() => {
    expect(capturedPaper).not.toBeNull();
    expect(capturedButton).not.toBeNull();
  });
  const paper = capturedPaper;
  const button = capturedButton;
  if (!paper || !button) throw new Error('paper or button not mounted');
  return { paper, button };
}

function dispatchAt(node: EventTarget, type: string, clientX: number, clientY: number) {
  node.dispatchEvent(new MouseEvent(type, { clientX, clientY, bubbles: true, cancelable: true }));
}

/** A real browser fires `click` on the pressed node after `mouseup` — jsdom does not. */
function dispatchClick(node: EventTarget) {
  dispatchAt(node, 'click', 0, 0);
}

describe('a button inside a node', () => {
  it('moves the element when dragged, and does not click', async () => {
    const clickSpy = jest.fn();
    const { paper, button } = await renderNodeWithButton(clickSpy);
    const element = paper.model.getCell(ELEMENT_ID);
    const positionBefore = { ...element.get('position') };

    dispatchAt(button, 'mousedown', 10, 10);
    // `clickThreshold` counts move events, not pixels, so a drag has to be more than a
    // single jump for joint-core to stop treating the gesture as a click.
    for (let step = 1; step <= 8; step += 1) {
      dispatchAt(document, 'pointermove', 10 + step * 10, 10 + step * 10);
    }
    dispatchAt(document, 'pointerup', 90, 90);
    dispatchClick(button);

    expect(element.get('position')).not.toEqual(positionBefore);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('clicks when pressed without moving, and does not move the element', async () => {
    const clickSpy = jest.fn();
    const { paper, button } = await renderNodeWithButton(clickSpy);
    const element = paper.model.getCell(ELEMENT_ID);
    const positionBefore = { ...element.get('position') };

    dispatchAt(button, 'mousedown', 10, 10);
    dispatchAt(document, 'pointerup', 10, 10);
    dispatchClick(button);

    expect(element.get('position')).toEqual(positionBefore);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
