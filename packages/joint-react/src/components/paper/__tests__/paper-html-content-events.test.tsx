/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useCallback } from 'react';
import { render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../../components';
import { usePaper } from '../../../hooks/use-paper';
import type { PaperView } from '../../../mvc/paper';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import type { CellRecord } from '../../../types/cell.types';

// `<Paper>` children are portaled into `paper.el`, so an overlay, popup or toolbar
// rendered there is a DOM sibling of the paper's SVG. Pressing one opens a blank
// interaction: `paper.el` is the paper's own event surface, and that press has always
// started a drag there.
//
// Suppressing it from React alone is not possible. React attaches its delegated listeners
// to the portal container, which here IS `paper.el` — the very node the paper delegates
// on, and the paper got there first. So a React `onMouseDown` runs AFTER the paper has
// already reacted, and `stopPropagation()` is too late. Native `mousedown` / `touchstart`
// listeners would work but break React's own `onMouseDown` on the overlay content.
//
// The `guard` paper option is the supported way out: `pointerdown` consults it for a
// press that hit no cell view too, so an overlay can opt out without leaving React.

const initialCells: readonly CellRecord[] = [
  {
    id: 'cell-1',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
];

let capturedPaper: PaperView | null = null;
let capturedButton: HTMLButtonElement | null = null;

function Capture() {
  capturedPaper = usePaper().paper;
  return null;
}

interface OverlayProbeProps {
  readonly onButtonMouseDown: () => void;
}

function OverlayProbe({ onButtonMouseDown }: Readonly<OverlayProbeProps>) {
  const buttonRef = useCallback((node: HTMLButtonElement | null) => {
    capturedButton = node;
  }, []);
  return (
    <div>
      <button type="button" ref={buttonRef} onMouseDown={onButtonMouseDown}>
        overlay button
      </button>
    </div>
  );
}

const renderElement = () => <rect width={50} height={50} />;

const readPaper = (): PaperView | null => capturedPaper;
const readButton = (): HTMLButtonElement | null => capturedButton;

/**
 * Mount a paper with overlay content portaled into `paper.el`.
 * @param onButtonMouseDown - Spy for the overlay button's React `onMouseDown`.
 * @returns The mounted paper view.
 */
async function renderPaperWithOverlay(onButtonMouseDown: () => void): Promise<PaperView> {
  capturedPaper = null;
  capturedButton = null;
  render(
    <GraphProvider initialCells={initialCells}>
      <Paper style={{ width: 100, height: 100 }} id="html-content-paper" renderElement={renderElement}>
        <OverlayProbe onButtonMouseDown={onButtonMouseDown} />
        <Capture />
      </Paper>
    </GraphProvider>
  );
  await waitFor(() => {
    expect(capturedPaper).not.toBeNull();
    expect(capturedButton).not.toBeNull();
  });
  const paper = readPaper();
  if (!paper) throw new Error('paper not mounted');
  return paper;
}

describe('HTML content inside the paper container', () => {
  it('starts a blank interaction when pressed', async () => {
    const paper = await renderPaperWithOverlay(() => {});
    const blankPointerdown = jest.fn();
    paper.on('blank:pointerdown', blankPointerdown);

    readButton()?.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true })
    );

    expect(blankPointerdown).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  it('lets the guard option suppress that blank interaction', async () => {
    const paper = await renderPaperWithOverlay(() => {});
    const blankPointerdown = jest.fn();
    paper.on('blank:pointerdown', blankPointerdown);
    const overlayElement = readButton()?.parentElement;
    paper.options.guard = (event) => !!overlayElement?.contains(event.target as Node);

    readButton()?.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true })
    );

    expect(blankPointerdown).not.toHaveBeenCalled();

    // The guard is scoped to the overlay: the SVG still opens a blank interaction.
    paper.svg.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true })
    );

    expect(blankPointerdown).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  it('still lets React events on that content fire', async () => {
    const onButtonMouseDown = jest.fn();
    await renderPaperWithOverlay(onButtonMouseDown);

    readButton()?.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true })
    );

    expect(onButtonMouseDown).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  it('still starts a blank interaction when the SVG itself is pressed', async () => {
    const paper = await renderPaperWithOverlay(() => {});
    const blankPointerdown = jest.fn();
    paper.on('blank:pointerdown', blankPointerdown);

    paper.svg.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true })
    );

    expect(blankPointerdown).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });
});
