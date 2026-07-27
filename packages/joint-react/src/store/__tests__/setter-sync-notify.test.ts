import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { graphProjection } from '../graph-projection';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/**
 * A `data` edit (from `useSetCellData` / `useSetCell`) must notify subscribers
 * SYNCHRONOUSLY: a controlled `<input>`/`<textarea>` whose value comes from cell
 * data otherwise re-renders one microtask after the keystroke, and the browser
 * resets its caret to the end (you can't type in the middle). Layout changes
 * (drags — position/size) stay coalesced on a microtask so they don't storm.
 */
describe('data edits notify synchronously; layout changes coalesce', () => {
  it('notifies a cell subscriber synchronously for a data change', () => {
    const graph = createGraph();
    const view = graphProjection({ graph });
    graph.addCell({
      id: 'el-1',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
      data: { text: 'ab' },
    });

    let notified = 0;
    const unsubscribe = view.cells.subscribeById('el-1', () => {
      notified += 1;
    });

    graph.getCell('el-1')!.set('data', { text: 'axb' });

    // No `await flush()` — the subscriber must have fired already, and the
    // container must already expose the new data.
    expect(notified).toBe(1);
    expect(view.cells.get('el-1')?.data).toEqual({ text: 'axb' });

    unsubscribe();
    view.destroy();
  });

  it('coalesces a layout (position) change onto a microtask (drag)', async () => {
    const graph = createGraph();
    const view = graphProjection({ graph });
    graph.addCell({
      id: 'el-1',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
      data: { text: 'ab' },
    });
    await flush();

    let notified = 0;
    const unsubscribe = view.cells.subscribeById('el-1', () => {
      notified += 1;
    });

    graph.getCell('el-1')!.set('position', { x: 5, y: 5 });

    // Layout change is NOT a data edit → deferred, not yet notified.
    expect(notified).toBe(0);
    await flush();
    expect(notified).toBe(1);

    unsubscribe();
    view.destroy();
  });
});
