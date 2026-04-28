import { render, waitFor } from '@testing-library/react';
import { paperRenderLinkWrapper } from '../../utils/test-wrappers';
import { useLinkLayout } from '../use-link-layout';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { CellRecord } from '../../types/cell.types';
import type { LinkLayout } from '../../types/cell-data';

type Reading = {
  value: LinkLayout | undefined;
  renderCount: number;
};

let capturedReading: Reading = { value: undefined, renderCount: 0 };

function resetCapturedReading() {
  capturedReading = { value: undefined, renderCount: 0 };
}

function Probe() {
  const layout = useLinkLayout();
  capturedReading = {
    value: layout,
    renderCount: capturedReading.renderCount + 1,
  };
  return null;
}

const initialCells: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 10, y: 10 },
    size: { width: 80, height: 40 },
  } as CellRecord,
  {
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 400, y: 400 },
    size: { width: 80, height: 40 },
  } as CellRecord,
  {
    id: 'link-1',
    type: LINK_MODEL_TYPE,
    source: { id: 'a' },
    target: { id: 'b' },
  } as CellRecord,
];

const wrapper = paperRenderLinkWrapper({
  graphProviderProps: { initialCells },
});

describe('useLinkLayout — regression guards', () => {
  it('does not trigger the "Maximum update depth exceeded" loop', async () => {
    // Before the structural-equality cache: `getSnapshot` allocated a fresh
    // `{ sourceX, sourceY, targetX, targetY, d }` object every call, which
    // violated the `useSyncExternalStore` contract. React saw every render
    // as a store change and re-rendered indefinitely.
    //
    // React signals that loop with a console.error containing "Maximum
    // update depth exceeded" — we spy on console.error to assert the fix.
    resetCapturedReading();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<Probe />, { wrapper });

    await waitFor(() => {
      expect(capturedReading.renderCount).toBeGreaterThan(0);
    });

    // Give React + JointJS a few microtasks to settle any render passes.
    await new Promise((resolve) => setTimeout(resolve, 10));

    const depthLoops = consoleError.mock.calls.filter((args) =>
      args.some(
        (argument) =>
          typeof argument === 'string' && argument.includes('Maximum update depth exceeded')
      )
    );
    expect(depthLoops).toHaveLength(0);

    consoleError.mockRestore();
  });

  it('keeps render count bounded — a finite number of renders after mount', async () => {
    // If the snapshot cache regresses, the hook would re-render on every
    // commit until React hits its internal cap. Cap this at a generous but
    // finite number so any future regression is caught here.
    resetCapturedReading();
    render(<Probe />, { wrapper });

    await waitFor(() => {
      expect(capturedReading.renderCount).toBeGreaterThan(0);
    });

    // Settle everything.
    await new Promise((resolve) => setTimeout(resolve, 50));

    // A correct implementation produces a small number of renders (one on
    // mount, plus a handful for paper setup + render:done). 50 is
    // generous-by-design; an infinite-loop regression would push past this
    // immediately.
    expect(capturedReading.renderCount).toBeLessThan(50);
  });
});
