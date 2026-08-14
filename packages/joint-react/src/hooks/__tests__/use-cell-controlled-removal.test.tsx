import { Component, type ReactNode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { useCell } from '../use-cell';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord, Computed, ElementRecord } from '../../types/cell.types';

// Surfaces an error thrown anywhere in its subtree so the test can assert on it
// instead of the throw tearing down the whole test render.
class CatchErrorBoundary extends Component<
  Readonly<{ onCatch: (error: Error) => void; children: ReactNode }>,
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    this.props.onCatch(error);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

interface NodeData {
  readonly label: string;
}

// Module-scope error capture so the JSX prop is a stable reference (avoids
// react-perf's new-function-as-prop rule), mirroring use-cell.test.tsx.
const caughtState: { error: Error | null } = { error: null };
function captureError(error: Error) {
  caughtState.error = error;
}

function buildCells(secondId: string): ReadonlyArray<CellRecord<NodeData>> {
  return [
    {
      id: 'a',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 0, y: 0 },
      size: { width: 40, height: 40 },
      data: { label: 'a' },
    },
    {
      id: secondId,
      type: ELEMENT_MODEL_TYPE,
      position: { x: 80, y: 0 },
      size: { width: 40, height: 40 },
      data: { label: secondId },
    },
  ];
}

// Subscribes to its OWN cell via useCell — the ingredient the crash needs. This
// is exactly what a content-sized node does through useMeasureElement, so the
// scenario is reachable without a consumer ever naming useCell.
function SubscribingNode() {
  const label = useCell((cell: Computed<ElementRecord<NodeData>>) => cell.data.label);
  return <text>{label}</text>;
}
const renderSubscribing = () => <SubscribingNode />;

const PAPER_STYLE = { width: 200, height: 200 } as const;

// Regression: removing a cell from a controlled `cells` array must not throw.
// When a renderElement subtree subscribes to its own cell, the controlled
// removal fires that cell's per-id listener synchronously (inside
// GraphProvider's applyControlled layout effect) before <Paper> unmounts the
// portal. The still-mounted subtree then re-selects against a cell that is
// already gone. Before the fix, useCell's selector threw
// `useCell(): no cell with id "b"`, unrecoverably taking the whole paper down.
describe('useCell — controlled cell removal', () => {
  // Restore the console.error spy even when an assertion throws mid-test, so
  // the mock can never leak into other tests.
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not throw when a subscribed cell is removed from a controlled cells array', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    caughtState.error = null;

    const { rerender, container } = render(
      <CatchErrorBoundary onCatch={captureError}>
        <GraphProvider cells={buildCells('b')}>
          <Paper style={PAPER_STYLE} id="usecell-removal-paper" renderElement={renderSubscribing} />
        </GraphProvider>
      </CatchErrorBoundary>
    );

    // Both element subtrees mounted and subscribed before we remove one.
    await waitFor(() => {
      expect(container.querySelectorAll('.joint-cell.joint-element')).toHaveLength(2);
    });

    // Rename the second cell id b -> c: a remove ('b') + add ('c') on the
    // controlled array. Pre-fix this throws synchronously during the controlled
    // apply, before Paper unmounts b's portal.
    await act(async () => {
      rerender(
        <CatchErrorBoundary onCatch={captureError}>
          <GraphProvider cells={buildCells('c')}>
            <Paper style={PAPER_STYLE} id="usecell-removal-paper" renderElement={renderSubscribing} />
          </GraphProvider>
        </CatchErrorBoundary>
      );
    });

    // Paper survives: the removal reconciles to the two surviving elements (a, c).
    await waitFor(() => {
      expect(container.querySelectorAll('.joint-cell.joint-element')).toHaveLength(2);
    });
    expect(caughtState.error).toBeNull();
  });
});
