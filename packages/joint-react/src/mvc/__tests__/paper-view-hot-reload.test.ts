/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
/**
 * A dev-server hot reload (HMR) re-evaluates `mvc/paper.ts`, producing a NEW
 * `PaperView` class identity while live paper instances still come from the
 * previous evaluation. Guards in the render path must therefore duck-type the
 * PaperView contract instead of using `instanceof`, or every element/link
 * portal bails out and the canvas goes blank after the reload
 * (clientIO/joint#3483).
 */
import type { dia } from '@joint/core';
import type * as PaperViewModule from '../paper';
import { isPaperView, PaperView } from '../paper';
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

describe('isPaperView — hot-reload-safe PaperView guard', () => {
  it('accepts a PaperView whose class comes from a re-evaluated module', () => {
    const fresh = requirePaperModuleFresh();
    expect(fresh.PaperView).not.toBe(PaperView);

    // Instance shaped by the OTHER evaluation of the class — what the render
    // path sees right after an HMR update.
    const crossEvaluationPaper: dia.Paper = Object.create(fresh.PaperView.prototype);

    // The hazard: class identity does not survive a module re-evaluation…
    expect(crossEvaluationPaper instanceof PaperView).toBe(false);
    // …but the capability guard does.
    expect(isPaperView(crossEvaluationPaper)).toBe(true);
  });

  it('accepts a same-evaluation PaperView and rejects non-PaperView papers', () => {
    const sameEvaluationPaper: dia.Paper = Object.create(PaperView.prototype);
    expect(isPaperView(sameEvaluationPaper)).toBe(true);

    const plainPaper: dia.Paper = Object.create(Object.prototype);
    expect(isPaperView(plainPaper)).toBe(false);
    expect(isPaperView(null)).toBe(false);
    // The explicit `undefined` is the point here — it exercises the guard's
    // nullish branch.
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(isPaperView(undefined)).toBe(false);
  });
});
