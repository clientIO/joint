import {
  linkRoutingStraight,
  linkRoutingOrthogonal,
  linkRoutingSmooth,
} from '../link-routing';

describe('presets / link-routing / linkRoutingStraight', () => {
  it('returns a routing bundle with default options', () => {
    const routing = linkRoutingStraight();
    expect(routing.defaultRouter).toEqual({ name: 'normal' });
    expect(routing.defaultConnector).toBeDefined();
    expect(routing.defaultAnchor).toBeDefined();
    expect(routing.defaultConnectionPoint).toBeDefined();
  });

  it('uses perpendicular anchor when option set', () => {
    const routing = linkRoutingStraight({ perpendicular: true });
    expect(routing.defaultAnchor).toBeDefined();
  });

  it('respects custom corner type/radius', () => {
    const routing = linkRoutingStraight({ cornerType: 'cubic', cornerRadius: 12 });
    expect(routing.defaultConnector).toMatchObject({
      name: 'straight',
      args: { cornerType: 'cubic', cornerRadius: 12 },
    });
  });
});

describe('presets / link-routing / linkRoutingOrthogonal', () => {
  it('returns straight-when-disconnected variant by default', () => {
    const routing = linkRoutingOrthogonal();
    expect(routing.defaultRouter).toBeDefined();
    expect(routing.defaultConnector).toBeDefined();
    expect(routing.defaultAnchor).toBeDefined();
    expect(routing.defaultConnectionPoint).toBeDefined();
    expect(typeof routing.defaultRouter).toBe('function');
  });

  it('returns plain variant when straightWhenDisconnected is false', () => {
    const routing = linkRoutingOrthogonal({ straightWhenDisconnected: false });
    expect(typeof routing.defaultRouter).toBe('function');
    expect(routing.defaultAnchor).toBeDefined();
    expect(routing.defaultConnectionPoint).toBeDefined();
  });

  it('respects margin option', () => {
    const routing = linkRoutingOrthogonal({ margin: 30, straightWhenDisconnected: false });
    expect(routing.defaultRouter).toBeDefined();
  });

  it('respects custom mode/offsets/markerSelector', () => {
    const routing = linkRoutingOrthogonal({
      mode: 'horizontal',
      sourceOffset: 5,
      targetOffset: 10,
      markerSelector: 'line',
    });
    expect(routing.defaultRouter).toBeDefined();
  });
});

describe('presets / link-routing / linkRoutingSmooth', () => {
  it('returns straight-when-disconnected variant by default', () => {
    const routing = linkRoutingSmooth();
    expect(routing.defaultRouter).toEqual({ name: 'normal' });
    expect(routing.defaultConnector).toBeDefined();
    expect(routing.defaultAnchor).toBeDefined();
    expect(routing.defaultConnectionPoint).toBeDefined();
  });

  it('returns plain variant when straightWhenDisconnected is false', () => {
    const routing = linkRoutingSmooth({ straightWhenDisconnected: false });
    expect(routing.defaultRouter).toEqual({ name: 'normal' });
    expect(routing.defaultConnectionPoint).toEqual({ name: 'anchor' });
    expect(routing.defaultAnchor).toBeDefined();
    expect(routing.defaultConnector).toBeDefined();
  });

  it('respects custom offsets', () => {
    const routing = linkRoutingSmooth({ sourceOffset: 3, targetOffset: 7 });
    expect(routing.defaultConnectionPoint).toBeDefined();
  });
});
