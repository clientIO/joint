/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  straightRouterUntilConnected,
  straightConnectorUntilConnected,
  anchorWhenConnected,
  connectionPointWhenAnchorIsDefault,
  connectionPointWhenConnected,
} from '../wrappers';

function makeLinkView(hasSource: boolean, hasTarget: boolean) {
  const model = {
    getSourceCell: jest.fn(() => (hasSource ? { id: 's' } : null)),
    getTargetCell: jest.fn(() => (hasTarget ? { id: 't' } : null)),
  };
  return { model } as any;
}

describe('presets / wrappers / straightRouterUntilConnected', () => {
  it('returns vertices when no linkView provided', () => {
    const router = jest.fn();
    const wrapped = straightRouterUntilConnected(router as any);
    const vertices = [{ x: 1, y: 1 }];
    const result = wrapped(vertices as any, {} as any, undefined as any);
    expect(result).toBe(vertices);
    expect(router).not.toHaveBeenCalled();
  });

  it('returns empty array when source is missing', () => {
    const router = jest.fn();
    const wrapped = straightRouterUntilConnected(router as any);
    const linkView = makeLinkView(false, true);
    const result = wrapped([], {} as any, linkView);
    expect(result).toEqual([]);
    expect(router).not.toHaveBeenCalled();
  });

  it('returns empty array when target is missing', () => {
    const router = jest.fn();
    const wrapped = straightRouterUntilConnected(router as any);
    const linkView = makeLinkView(true, false);
    const result = wrapped([], {} as any, linkView);
    expect(result).toEqual([]);
    expect(router).not.toHaveBeenCalled();
  });

  it('delegates to router when both ends connected', () => {
    const router = jest.fn(() => ['routed']);
    const wrapped = straightRouterUntilConnected(router as any);
    const linkView = makeLinkView(true, true);
    const vertices = [{ x: 1, y: 1 }];
    const result = wrapped(vertices as any, { foo: 'bar' } as any, linkView);
    expect(router).toHaveBeenCalledWith(vertices, { foo: 'bar' }, linkView);
    expect(result).toEqual(['routed']);
  });
});

describe('presets / wrappers / straightConnectorUntilConnected', () => {
  it('falls back to straight when source missing', () => {
    const connector = jest.fn();
    const wrapped = straightConnectorUntilConnected(connector as any);
    const linkView = makeLinkView(false, true);
    const result = wrapped(
      { x: 0, y: 0 } as any,
      { x: 10, y: 0 } as any,
      [],
      {},
      linkView
    );
    // straight returns a path string
    expect(typeof result).toBe('string');
    expect(connector).not.toHaveBeenCalled();
  });

  it('falls back to straight when no linkView', () => {
    const connector = jest.fn();
    const wrapped = straightConnectorUntilConnected(connector as any);
    const result = wrapped(
      { x: 0, y: 0 } as any,
      { x: 10, y: 0 } as any,
      [],
      {},
      undefined as any
    );
    expect(typeof result).toBe('string');
    expect(connector).not.toHaveBeenCalled();
  });

  it('delegates to connector when both ends connected', () => {
    const connector = jest.fn(() => 'CONNECTOR_RESULT');
    const wrapped = straightConnectorUntilConnected(connector as any);
    const linkView = makeLinkView(true, true);
    const result = wrapped(
      { x: 0, y: 0 } as any,
      { x: 10, y: 0 } as any,
      [],
      { args: 1 },
      linkView
    );
    expect(connector).toHaveBeenCalled();
    expect(result).toBe('CONNECTOR_RESULT');
  });
});

describe('presets / wrappers / anchorWhenConnected', () => {
  it('uses disconnected when source missing', () => {
    const connected = jest.fn(() => 'C');
    const disconnected = jest.fn(() => 'D');
    const wrapped = anchorWhenConnected(connected as any, disconnected as any);
    const linkView = makeLinkView(false, true);
    const result = wrapped(
      {} as any, {} as any, {} as any, {}, 'source', linkView
    );
    expect(result).toBe('D');
    expect(connected).not.toHaveBeenCalled();
    expect(disconnected).toHaveBeenCalled();
  });

  it('uses connected when both ends connected', () => {
    const connected = jest.fn(() => 'C');
    const disconnected = jest.fn(() => 'D');
    const wrapped = anchorWhenConnected(connected as any, disconnected as any);
    const linkView = makeLinkView(true, true);
    const result = wrapped(
      {} as any, {} as any, {} as any, {}, 'target', linkView
    );
    expect(result).toBe('C');
    expect(connected).toHaveBeenCalled();
    expect(disconnected).not.toHaveBeenCalled();
  });
});

describe('presets / wrappers / connectionPointWhenConnected', () => {
  it('uses disconnected when target missing', () => {
    const connected = jest.fn(() => 'C');
    const disconnected = jest.fn(() => 'D');
    const wrapped = connectionPointWhenConnected(connected as any, disconnected as any);
    const linkView = makeLinkView(true, false);
    const result = wrapped(
      {} as any, {} as any, {} as any, {}, 'source', linkView
    );
    expect(result).toBe('D');
    expect(connected).not.toHaveBeenCalled();
  });

  it('uses connected when both ends connected', () => {
    const connected = jest.fn(() => 'C');
    const disconnected = jest.fn(() => 'D');
    const wrapped = connectionPointWhenConnected(connected as any, disconnected as any);
    const linkView = makeLinkView(true, true);
    const result = wrapped(
      {} as any, {} as any, {} as any, {}, 'target', linkView
    );
    expect(result).toBe('C');
    expect(disconnected).not.toHaveBeenCalled();
  });
});

function makeLinkViewWithEnds(sourceEnd?: unknown, targetEnd?: unknown) {
  const model = {
    getSourceCell: jest.fn(() => ({ id: 's' })),
    getTargetCell: jest.fn(() => ({ id: 't' })),
    source: jest.fn(() => sourceEnd),
    target: jest.fn(() => targetEnd),
  };
  return { model } as any;
}

describe('presets / wrappers / connectionPointWhenAnchorIsDefault', () => {
  it('uses the preset connection point when the end takes the default anchor', () => {
    const presetAnchor = jest.fn(() => 'P');
    const customAnchor = jest.fn(() => 'C');
    const wrapped = connectionPointWhenAnchorIsDefault(presetAnchor as any, customAnchor as any);
    const linkView = makeLinkViewWithEnds({ id: 's' }, { id: 't' });
    const result = wrapped({} as any, {} as any, {} as any, {}, 'target', linkView);
    expect(result).toBe('P');
    expect(customAnchor).not.toHaveBeenCalled();
  });

  it('uses the custom connection point when the end declares its own anchor', () => {
    const presetAnchor = jest.fn(() => 'P');
    const customAnchor = jest.fn(() => 'C');
    const wrapped = connectionPointWhenAnchorIsDefault(presetAnchor as any, customAnchor as any);
    const linkView = makeLinkViewWithEnds(
      { id: 's' },
      { id: 't', anchor: { name: 'modelCenter', args: { dx: 0, dy: -20 }}}
    );
    const result = wrapped({} as any, {} as any, {} as any, {}, 'target', linkView);
    expect(result).toBe('C');
    expect(presetAnchor).not.toHaveBeenCalled();
  });

  it('decides per end, so one custom anchor does not affect the other end', () => {
    const presetAnchor = jest.fn(() => 'P');
    const customAnchor = jest.fn(() => 'C');
    const wrapped = connectionPointWhenAnchorIsDefault(presetAnchor as any, customAnchor as any);
    const linkView = makeLinkViewWithEnds({ id: 's', anchor: { name: 'center' }}, { id: 't' });
    expect(wrapped({} as any, {} as any, {} as any, {}, 'source', linkView)).toBe('C');
    expect(wrapped({} as any, {} as any, {} as any, {}, 'target', linkView)).toBe('P');
  });

  it('treats an end with no definition as taking the default anchor', () => {
    const presetAnchor = jest.fn(() => 'P');
    const customAnchor = jest.fn(() => 'C');
    const wrapped = connectionPointWhenAnchorIsDefault(presetAnchor as any, customAnchor as any);
    const linkView = makeLinkViewWithEnds();
    const result = wrapped({} as any, {} as any, {} as any, {}, 'source', linkView);
    expect(result).toBe('P');
    expect(customAnchor).not.toHaveBeenCalled();
  });
});
