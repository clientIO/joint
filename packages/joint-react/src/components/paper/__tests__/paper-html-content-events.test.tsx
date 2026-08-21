/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useCallback } from 'react';
import type { dia } from '@joint/core';
import { render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../../components';
import { usePaper } from '../../../hooks/use-paper';
import type { PaperView } from '../../../mvc/paper';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import type { CellRecord } from '../../../types/cell.types';

// `<Paper>` children are portaled into `paper.el`, so an overlay, popup or toolbar
// rendered there is a DOM sibling of the paper's SVG. Pressing one must not open a blank
// interaction, and because it never has to be intercepted, React events on that content
// keep working normally.
//
// Suppressing it from React alone is not possible. React attaches its delegated listeners
// to the portal container, which here IS `paper.el` — the very node the paper delegates
// on, and the paper got there first. So a React `onMouseDown` runs AFTER the paper has
// already reacted, and `stopPropagation()` is too late. Native `mousedown` / `touchstart`
// listeners would work but break React's own `onMouseDown` on the overlay content.
//
// joint-core leaves such a press alone for backwards compatibility (plain `dia.Paper`
// users render their own content into `paper.el` and rely on the blank interaction).
// The `guardExplicit` override in the paper preset is what makes it inert here.

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

/** The guard pair, reachable from a test: both are `protected` on `dia.Paper`. */
interface GuardProbe {
  readonly guard: (event: dia.Event, view?: dia.CellView) => boolean;
  readonly guardExplicit: (event: dia.Event, view?: dia.CellView) => boolean | undefined;
}

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
  it('does not start a blank interaction when pressed', async () => {
    const paper = await renderPaperWithOverlay(() => {});
    const blankPointerdown = jest.fn();
    paper.on('blank:pointerdown', blankPointerdown);

    readButton()?.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true })
    );

    expect(blankPointerdown).not.toHaveBeenCalled();
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

  // `paper.el` is the container the portaled content lives in, not portaled content
  // itself. joint-core documents it as part of the paper's event surface (`guard()`:
  // `if (this.el === target || …) return false`), which is what makes replaying a
  // synthetic event onto it a way to reach the paper's pipeline. `guardExplicit` must
  // stay undecided there — `Node.contains()` is true for the node itself, so the
  // portaled-content check would otherwise claim it and drop the event.
  it('does not guard an event targeting the paper container itself', async () => {
    const paper = await renderPaperWithOverlay(() => {});
    // `guardExplicit` is protected on `dia.Paper`; the contract it implements is public.
    const { guard, guardExplicit } = paper as unknown as GuardProbe;
    const event = { type: 'wheel', target: paper.el } as unknown as dia.Event;

    expect(guardExplicit.call(paper, event)).toBeUndefined();
    expect(guard.call(paper, event)).toBe(false);
  });

  it('pans the paper for a wheel replayed onto the paper container', async () => {
    const paper = await renderPaperWithOverlay(() => {});
    const pan = jest.fn();
    paper.on('paper:pan', pan);

    paper.el.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })
    );

    expect(pan).toHaveBeenCalledTimes(1);
  });
});
