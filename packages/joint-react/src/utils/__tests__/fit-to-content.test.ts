import { g } from '@joint/core';
import {
  isFitScroller,
  normalizeFitOptions,
  resolveFitHost,
  resolveFitScroller,
  runFit,
} from '../fit-to-content';
import type { FitStoreLike } from '../fit-to-content';

describe('normalizeFitOptions', () => {
  it('returns null when the prop is absent or false', () => {
    expect(normalizeFitOptions()).toBeNull();
    expect(normalizeFitOptions(false)).toBeNull();
  });

  it('maps `true` to centred zoom defaults refitting on resize', () => {
    expect(normalizeFitOptions(true)).toEqual({
      mode: 'zoom',
      refit: 'resize',
      useModelGeometry: true,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  });

  it('keeps caller options and fills only the missing defaults', () => {
    expect(normalizeFitOptions({ padding: 40, refit: 'once', verticalAlign: 'top' })).toEqual({
      mode: 'zoom',
      refit: 'once',
      padding: 40,
      useModelGeometry: true,
      verticalAlign: 'top',
      horizontalAlign: 'middle',
    });
  });

  it('normalizes the resize arm without zoom-only defaults', () => {
    expect(normalizeFitOptions({ mode: 'resize', allowNewOrigin: 'any' })).toEqual({
      mode: 'resize',
      refit: 'resize',
      useModelGeometry: true,
      allowNewOrigin: 'any',
    });
  });

  it('does not let an explicit undefined refit erase the default', () => {
    expect(normalizeFitOptions({ refit: undefined })?.refit).toBe('resize');
  });

  // Regression: a spread let an explicit `undefined` from the caller erase a
  // React default, silently falling back to core's top/left framing.
  it('does not let explicit undefined options erase the other React defaults', () => {
    expect(
      normalizeFitOptions({
        verticalAlign: undefined,
        horizontalAlign: undefined,
        useModelGeometry: undefined,
      })
    ).toEqual({
      mode: 'zoom',
      refit: 'resize',
      useModelGeometry: true,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  });

  it('keeps the resize arm default when useModelGeometry is explicitly undefined', () => {
    expect(normalizeFitOptions({ mode: 'resize', useModelGeometry: undefined })).toEqual({
      mode: 'resize',
      refit: 'resize',
      useModelGeometry: true,
    });
  });
});

const contentArea = new g.Rect(0, 0, 120, 80);

function createFakePaper() {
  return {
    el: document.createElement('div'),
    transformToFitContent: jest.fn(),
    fitToContent: jest.fn(() => new g.Rect(0, 0, 120, 80)),
    getContentArea: jest.fn(() => contentArea),
  };
}

function createFakeScroller() {
  return {
    el: document.createElement('div'),
    zoomToRect: jest.fn(),
    getZoomBounds: jest.fn(() => ({ min: 0.2, max: 4 })),
  };
}

/**
 * `runFit` reads only `paper` and `features`, so the tests build that narrow
 * shape rather than mounting a real `PaperStore`.
 * @param paper - Fake paper double.
 * @param features - Registered feature doubles.
 * @returns A store shaped like the slice `runFit` consumes.
 */
function createStore(
  paper: ReturnType<typeof createFakePaper>,
  features: Record<string, { readonly instance: unknown } | undefined>
): FitStoreLike & { readonly paper: ReturnType<typeof createFakePaper> } {
  return { paperId: 'p1', paper, features };
}

describe('isFitScroller', () => {
  it('accepts an object exposing the scroller surface the fit uses', () => {
    expect(isFitScroller(createFakeScroller())).toBe(true);
  });

  it('rejects null, primitives, and partial look-alikes', () => {
    expect(isFitScroller(null)).toBe(false);
    expect(isFitScroller('scroller')).toBe(false);
    expect(isFitScroller({ zoomToRect: jest.fn() })).toBe(false);
    expect(isFitScroller({ ...createFakeScroller(), el: 'nope' })).toBe(false);
  });
});

describe('runFit', () => {
  it('calls transformToFitContent in zoom mode without a scroller', () => {
    const paper = createFakePaper();
    runFit(createStore(paper, {}), { mode: 'zoom', refit: 'once', padding: 10 });
    expect(paper.transformToFitContent).toHaveBeenCalledTimes(1);
    expect(paper.fitToContent).not.toHaveBeenCalled();
  });

  it('calls fitToContent in resize mode without a scroller', () => {
    const paper = createFakePaper();
    runFit(createStore(paper, {}), { mode: 'resize', refit: 'once' });
    expect(paper.fitToContent).toHaveBeenCalledTimes(1);
    expect(paper.transformToFitContent).not.toHaveBeenCalled();
  });

  it('routes zoom mode through a registered scroller, clamped to its zoom bounds', () => {
    const paper = createFakePaper();
    const scroller = createFakeScroller();
    runFit(createStore(paper, { paperScroller: { instance: scroller } }), {
      mode: 'zoom',
      refit: 'once',
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
    expect(paper.transformToFitContent).not.toHaveBeenCalled();
    expect(scroller.zoomToRect).toHaveBeenCalledTimes(1);
    const [[rect, options]] = scroller.zoomToRect.mock.calls;
    expect(rect).toEqual(contentArea);
    expect(options).toMatchObject({ minScale: 0.2, maxScale: 4, verticalAlign: 'middle' });
  });

  it('skips resize mode under a scroller and warns', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const paper = createFakePaper();
    const scroller = createFakeScroller();
    runFit(createStore(paper, { paperScroller: { instance: scroller } }), {
      mode: 'resize',
      refit: 'once',
    });
    expect(paper.fitToContent).not.toHaveBeenCalled();
    expect(scroller.zoomToRect).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does nothing when the content has no area', () => {
    const paper = createFakePaper();
    paper.getContentArea.mockReturnValue(new g.Rect(0, 0, 0, 0));
    runFit(createStore(paper, {}), { mode: 'zoom', refit: 'once' });
    expect(paper.transformToFitContent).not.toHaveBeenCalled();
  });

  it('resolves the resize host to the scroller element when one is registered', () => {
    const paper = createFakePaper();
    const scroller = createFakeScroller();
    expect(resolveFitHost(createStore(paper, {}))).toBe(paper.el);
    expect(resolveFitHost(createStore(paper, { paperScroller: { instance: scroller } }))).toBe(
      scroller.el
    );
  });

  it('ignores a feature registered under the scroller key that is not one', () => {
    expect(
      resolveFitScroller(
        createStore(createFakePaper(), { paperScroller: { instance: { nope: true } } })
      )
    ).toBeNull();
  });
});
