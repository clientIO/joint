/* eslint-disable @typescript-eslint/no-explicit-any */
import { g } from '@joint/core';
import type { LinkRouting } from '../link-routing';
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
    // The anchor connection point, wrapped so an end with its own anchor still
    // gets the arrowhead accounted for.
    expect(typeof routing.defaultConnectionPoint).toBe('function');
    expect(routing.defaultAnchor).toBeDefined();
    expect(routing.defaultConnector).toBeDefined();
  });

  it('respects custom offsets', () => {
    const routing = linkRoutingSmooth({ sourceOffset: 3, targetOffset: 7 });
    expect(routing.defaultConnectionPoint).toBeDefined();
  });
});

const MARKER_LENGTH = 9;

/** A link end, with an anchor of its own when one is given. */
function makeEnd(anchor?: object) {
  return anchor ? { id: 'e', anchor } : { id: 'e' };
}

function makeLinkView(targetAnchor?: object) {
  const model = {
    getSourceCell: () => ({ id: 's' }),
    getTargetCell: () => ({ id: 't' }),
    source: () => makeEnd(),
    target: () => makeEnd(targetAnchor),
    attributes: { attrs: { line: { targetMarker: { length: MARKER_LENGTH }}}},
  };
  return { model, metrics: {} } as any;
}

/** The last segment of a route arriving at (100, 260) from directly above. */
function makeEndSegment() {
  return { start: new g.Point(100, 100), end: new g.Point(100, 260) } as any;
}

/** With no port on the link, the element's own node doubles as the magnet. */
function makeEndView() {
  const element = {} as SVGElement;
  return [{ el: element } as any, element] as const;
}

function targetPointY(routing: LinkRouting, targetAnchor?: object) {
  const [endView, magnet] = makeEndView();
  return (routing.defaultConnectionPoint as any)(
    makeEndSegment(),
    endView,
    magnet,
    {},
    'target',
    makeLinkView(targetAnchor)
  ).y;
}

const CUSTOM_ANCHOR = { name: 'modelCenter', args: { dx: 0, dy: -20 }};

describe('presets / link-routing / arrowhead inset', () => {
  it('accounts for the arrowhead on an end that carries its own anchor', () => {
    // The preset's anchor never ran for this end, so the connection point is
    // what keeps the arrowhead off the element.
    expect(targetPointY(linkRoutingOrthogonal(), CUSTOM_ANCHOR)).toBe(260 - MARKER_LENGTH);
    expect(
      targetPointY(linkRoutingOrthogonal({ straightWhenDisconnected: false }), CUSTOM_ANCHOR)
    ).toBe(260 - MARKER_LENGTH);
  });

  it('adds the per-end offset to the arrowhead', () => {
    const routing = linkRoutingOrthogonal({ targetOffset: 6 });
    expect(targetPointY(routing, CUSTOM_ANCHOR)).toBe(260 - MARKER_LENGTH - 6);
  });

  it('leaves an end taking the preset anchor untouched', () => {
    // `midSideAnchor` accounted for both there, so doing it again would count
    // them twice.
    expect(targetPointY(linkRoutingOrthogonal())).toBe(260);
    expect(targetPointY(linkRoutingOrthogonal({ targetOffset: 6 }))).toBe(260);
    expect(targetPointY(linkRoutingOrthogonal({ straightWhenDisconnected: false }))).toBe(260);
  });

  it('applies to the smooth preset as well', () => {
    expect(targetPointY(linkRoutingSmooth(), CUSTOM_ANCHOR)).toBe(260 - MARKER_LENGTH);
    expect(targetPointY(linkRoutingSmooth({ straightWhenDisconnected: false }), CUSTOM_ANCHOR))
      .toBe(260 - MARKER_LENGTH);
    expect(targetPointY(linkRoutingSmooth())).toBe(260);
  });
});
