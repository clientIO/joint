/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * A dev-server hot reload (HMR) re-evaluates `mvc/paper.ts`, producing a NEW
 * `PaperView` class identity while live paper instances still come from the
 * previous evaluation. Guards in the render path must therefore check the
 * `PaperView` marker symbol (from the global symbol registry, so it survives
 * the re-evaluation) instead of using `instanceof`, or every element/link
 * portal bails out and the canvas goes blank after the reload
 * (clientIO/joint#3483).
 */
import { dia } from '@joint/core';
import type * as PaperViewModule from '../paper';
import { isPaperView, PaperView } from '../paper';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import * as schedulerModule from '../../utils/scheduler';
import * as presetsPaperModule from '../../presets/paper';
import * as classNamesModule from '../../utils/class-names';

/**
 * Re-evaluates `mvc/paper.ts` only, sharing all its dependencies — the same
 * module-graph shape a Vite HMR update of that file produces.
 */
function requirePaperModuleFresh(): typeof PaperViewModule {
  jest.doMock('../../utils/scheduler', () => schedulerModule);
  jest.doMock('../../presets/paper', () => presetsPaperModule);
  jest.doMock('../../utils/class-names', () => classNamesModule);
  let fresh: typeof PaperViewModule | null = null;
  jest.isolateModules(() => {
    fresh = require('../paper');
  });
  jest.dontMock('../../utils/scheduler');
  jest.dontMock('../../presets/paper');
  jest.dontMock('../../utils/class-names');
  if (!fresh) {
    throw new Error('mvc/paper re-evaluation failed');
  }
  return fresh;
}

/** A real instance of the given `PaperView` class on a throwaway graph. */
function createPaper(PaperViewClass: typeof PaperView): PaperView {
  const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  return new PaperViewClass({ model: graph, id: 'hot-reload', async: false, frozen: false });
}

describe('isPaperView — hot-reload-safe PaperView guard', () => {
  const papers: dia.Paper[] = [];
  afterEach(() => {
    for (const paper of papers.splice(0)) paper.remove();
  });

  it('accepts a PaperView whose class comes from a re-evaluated module', () => {
    const fresh = requirePaperModuleFresh();
    expect(fresh.PaperView).not.toBe(PaperView);

    // Instance created by the OTHER evaluation of the class — what the render
    // path sees right after an HMR update.
    const crossEvaluationPaper = createPaper(fresh.PaperView);
    papers.push(crossEvaluationPaper);

    // The hazard: class identity does not survive a module re-evaluation…
    expect(crossEvaluationPaper instanceof PaperView).toBe(false);
    // …but the marker does.
    expect(isPaperView(crossEvaluationPaper)).toBe(true);
  });

  it('accepts a same-evaluation PaperView and rejects non-PaperView papers', () => {
    const sameEvaluationPaper = createPaper(PaperView);
    papers.push(sameEvaluationPaper);
    expect(isPaperView(sameEvaluationPaper)).toBe(true);

    const plainPaper = new dia.Paper({
      model: new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE }),
      async: false,
      frozen: false,
    });
    papers.push(plainPaper);
    expect(isPaperView(plainPaper)).toBe(false);
    expect(isPaperView(null)).toBe(false);
    // The explicit `undefined` is the point here — it exercises the guard's
    // nullish branch.
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(isPaperView(undefined)).toBe(false);
  });
});
