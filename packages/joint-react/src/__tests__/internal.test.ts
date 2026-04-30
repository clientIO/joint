import * as internal from '../internal';

describe('internal entrypoint', () => {
  it('re-exports core hooks and utilities', () => {
    expect(typeof internal.useGraphStore).toBe('function');
    expect(typeof internal.useInternalData).toBe('function');
    expect(typeof internal.useImperativeApi).toBe('function');
    expect(typeof internal.useCreatePortalPaper).toBe('function');
    expect(typeof internal.useCreateFeature).toBe('function');
    expect(typeof internal.useCombinedRef).toBe('function');
    expect(typeof internal.usePaperStore).toBe('function');
    expect(typeof internal.useResolvePaperId).toBe('function');
  });

  it('re-exports feature provider and store classes', () => {
    expect(internal.FeaturesProvider).toBeDefined();
    expect(typeof internal.GraphStore).toBe('function');
    expect(typeof internal.PaperStore).toBe('function');
    expect(internal.DEFAULT_CELL_NAMESPACE).toBeDefined();
  });

  it('re-exports contexts', () => {
    expect(internal.GraphStoreContext).toBeDefined();
    expect(internal.PaperStoreContext).toBeDefined();
    expect(internal.CellIdContext).toBeDefined();
    expect(internal.PaperFeaturesContext).toBeDefined();
    expect(internal.GraphFeaturesContext).toBeDefined();
  });

  it('re-exports state primitives', () => {
    expect(typeof internal.createAtom).toBe('function');
  });

  it('re-exports data-mapping mappers', () => {
    expect(typeof internal.mapElementToAttributes).toBe('function');
    expect(typeof internal.mapAttributesToElement).toBe('function');
    expect(typeof internal.mapLinkToAttributes).toBe('function');
    expect(typeof internal.mapAttributesToLink).toBe('function');
  });

  it('re-exports render internals', () => {
    expect(internal.PaperHTMLContainer).toBeDefined();
    expect(internal.SVGElementItem).toBeDefined();
    expect(internal.HTMLElementItem).toBeDefined();
  });

  it('re-exports utility functions', () => {
    expect(typeof internal.assignOptions).toBe('function');
    expect(typeof internal.pickValues).toBe('function');
    expect(typeof internal.resolvePaper).toBe('function');
    expect(typeof internal.resolvePaperId).toBe('function');
  });

  it('re-exports constants', () => {
    expect(internal.ELEMENT_MODEL_TYPE).toBe('element');
    expect(internal.LINK_MODEL_TYPE).toBe('link');
    expect(typeof internal.PORTAL_SELECTOR).toBe('string');
  });

  it('re-exports internal selectors', () => {
    expect(typeof internal.selectResetVersion).toBe('function');
    expect(typeof internal.createSelectPaperVersion).toBe('function');
    expect(typeof internal.selectGraphFeaturesVersion).toBe('function');
  });

  it('re-exports paper event helpers', () => {
    expect(typeof internal.buildEventContext).toBe('function');
    expect(typeof internal.subscribeToPaperEvents).toBe('function');
  });
});
