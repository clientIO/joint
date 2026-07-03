/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop -- test-only ref callbacks. */
import { render, waitFor } from '@testing-library/react';
import { type dia } from '@joint/core';
import { Paper } from '../paper';
import { GraphProvider } from '../../graph/graph-provider';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import { LINK_MODEL_TYPE } from '../../../mvc/link-model';
import type { CellRecord } from '../../../types/cell.types';
import type { CellInteractivity } from '../../../presets/cell-interactivity';

const CELLS: readonly CellRecord[] = [
  { id: 'a', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 50, height: 50 } } as CellRecord,
  { id: 'b', type: ELEMENT_MODEL_TYPE, position: { x: 200, y: 0 }, size: { width: 50, height: 50 } } as CellRecord,
  { id: 'l1', type: LINK_MODEL_TYPE, source: { id: 'a' }, target: { id: 'b' } } as CellRecord,
];

async function mountPaper(interactive: CellInteractivity): Promise<dia.Paper> {
  let current: dia.Paper | null = null;
  render(
    <GraphProvider initialCells={CELLS}>
      <Paper
        ref={(paper) => {
          if (paper) current = paper;
        }}
        style={{ width: 300, height: 100 }}
        interactive={interactive}
      />
    </GraphProvider>
  );
  await waitFor(() => expect(current).not.toBeNull());
  return current as unknown as dia.Paper;
}

const linkView = (paper: dia.Paper): dia.LinkView =>
  paper.findViewByModel(paper.model.getCell('l1')) as dia.LinkView;

const elementView = (paper: dia.Paper): dia.ElementView =>
  paper.findViewByModel(paper.model.getCell('a')) as dia.ElementView;

describe('Paper interactive — link move', () => {
  it('interactive={true} disables linkMove/labelMove but keeps the rest interactive', async () => {
    const paper = await mountPaper(true);
    expect(paper.options.interactive).toEqual({ linkMove: false, labelMove: false });
    // `dragStart` (LinkView) gates link-body move on `can('linkMove')`.
    expect(linkView(paper).can('linkMove')).toBe(false);
    expect(linkView(paper).can('labelMove')).toBe(false);
    // The rest stays true implicitly — connected elements are still movable.
    expect(elementView(paper).can('elementMove')).toBe(true);
  });

  it('interactive={false} disables every interaction', async () => {
    const paper = await mountPaper(false);
    expect(paper.options.interactive).toBe(false);
    expect(elementView(paper).can('elementMove')).toBe(false);
    expect(linkView(paper).can('linkMove')).toBe(false);
  });

  it('default (no interactive) keeps linkMove disabled', async () => {
    let current: dia.Paper | null = null;
    render(
      <GraphProvider initialCells={CELLS}>
        <Paper
          ref={(paper) => {
            if (paper) current = paper;
          }}
          style={{ width: 300, height: 100 }}
        />
      </GraphProvider>
    );
    await waitFor(() => expect(current).not.toBeNull());
    const paper = current as unknown as dia.Paper;
    expect(linkView(paper).can('linkMove')).toBe(false);
  });

  it('object form { linkMove: true } enables linkMove', async () => {
    const paper = await mountPaper({ linkMove: true });
    expect(linkView(paper).can('linkMove')).toBe(true);
  });
});
