/* eslint-disable @typescript-eslint/no-explicit-any */
import { dia } from '@joint/core';
import { toNativeCellVisibility } from '../cell-visibility';
import { boundaryPoint, anchorPoint, withOffsets } from '../connection-points';
import { connectionStrategy } from '../connection-strategy';
import { outwardsCurveConnector } from '../connectors';
import { rightAngleRouter } from '../routers';
import { elementAttributes } from '../element-attributes';
import { elementPort, elementPorts } from '../element-ports';
import { toNativeInteractive } from '../interactive';
import { linkAttributes } from '../link-attributes';
import { linkStyleLine, linkStyleWrapper, linkStyle } from '../link-style';
import { getMarkerLength } from '../utils';
import { canEmbed, canUnembed } from '../can-embed';

describe('presets / cell-visibility', () => {
  it('returns undefined when no callback provided', () => {
    const noCallback: undefined = undefined;
    expect(toNativeCellVisibility(noCallback)).toBeUndefined();
  });
  it('forwards through native form when callback provided', () => {
    const cb = jest.fn(({ isMounted }) => isMounted);
    const native = toNativeCellVisibility(cb);
    const fakePaper = { model: { id: 'g' } } as any;
    const fakeCell = { id: 'c' } as any;
    const result = (native as any).call(fakePaper, fakeCell, true);
    expect(result).toBe(true);
    expect(cb).toHaveBeenCalledWith({
      model: fakeCell,
      isMounted: true,
      paper: fakePaper,
      graph: fakePaper.model,
    });
  });
});

function makeView(magnetIsRoot: boolean, port?: string) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const magnet = magnetIsRoot
    ? element
    : ((): SVGGraphicsElement => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        if (port) rect.setAttribute('port', port);
        return rect as unknown as SVGGraphicsElement;
      })();
  return { view: { el: element } as any, magnet };
}
function makeLine() {
  return { start: { x: 0, y: 0 }, end: { x: 10, y: 0, clone: () => ({ x: 10, y: 0 }) } } as any;
}

describe('presets / connection-points', () => {
  it('boundaryPoint is callable', () => {
    expect(typeof boundaryPoint).toBe('function');
  });

  it('anchorPoint root returns end clone', () => {
    const { view, magnet } = makeView(true);
    const out = anchorPoint(makeLine(), view, magnet, {} as any, 'source', {} as any);
    expect(out).toEqual({ x: 10, y: 0 });
  });

  it('anchorPoint port returns end clone', () => {
    const { view, magnet } = makeView(false, 'p');
    const out = anchorPoint(makeLine(), view, magnet, {} as any, 'target', {} as any);
    expect(out).toEqual({ x: 10, y: 0 });
  });

  it('withOffsets returns point unchanged when offset is 0', () => {
    const cp = jest.fn(() => ({ move: jest.fn().mockReturnThis() }));
    const wrapped = withOffsets(cp as any, 0, 0);
    const { view, magnet } = makeView(true);
    const linkView = { model: { attributes: { attrs: {} } } } as any;
    const out = wrapped(makeLine(), view, magnet, {} as any, 'source', linkView);
    expect(out).toBeDefined();
  });

  it('withOffsets applies move when offset non-zero', () => {
    const moveSpy = jest.fn().mockReturnThis();
    const cp = jest.fn(() => ({ move: moveSpy }));
    const wrapped = withOffsets(cp as any, 5, 3);
    const { view, magnet } = makeView(true);
    const linkView = { model: { attributes: { attrs: {} } } } as any;
    wrapped(makeLine(), view, magnet, {} as any, 'target', linkView);
    expect(moveSpy).toHaveBeenCalled();
  });
});

describe('presets / connection-strategy', () => {
  it('throws on unknown pin', () => {
    expect(() => connectionStrategy({ pin: 'bogus' as any })).toThrow();
  });
  it('returns strategy with default pin none', () => {
    const function_ = connectionStrategy({});
    expect(typeof function_).toBe('function');
  });
  it('runs customize when provided', () => {
    const customize = jest.fn(({ end }) => ({ ...end, x: 99 }));
    const function_ = connectionStrategy({ customize });
    const endView = {
      paper: { model: {} },
      model: { id: 'm' },
    } as any;
    const out = (function_ as any)({ x: 1, y: 2 }, endView, {}, { x: 1, y: 2 }, {}, 'source');
    expect(customize).toHaveBeenCalled();
    expect(out.x).toBe(99);
  });
});

describe('presets / connectors', () => {
  it('rightAngleRouter returns a function', () => {
    const router = rightAngleRouter();
    expect(typeof router).toBe('function');
  });
  it('outwardsCurveConnector callable', () => {
    expect(typeof outwardsCurveConnector).toBe('function');
  });
});

describe('presets / element-attributes', () => {
  it('throws on non-object input', () => {
    expect(() => elementAttributes(null as any)).toThrow();
  });
  it('throws when both portMap and ports provided', () => {
    expect(() =>
      elementAttributes({
        type: 'element',
        portMap: { a: { color: 'red' } },
        ports: { items: [] },
      } as any)
    ).toThrow();
  });
  it('passes through ports when only ports provided', () => {
    const out = elementAttributes({
      type: 'element',
      ports: { items: [{ id: 'p' }] },
    } as any);
    expect(out.ports).toEqual({ items: [{ id: 'p' }] });
  });
  it('builds ports from portMap', () => {
    const out = elementAttributes({
      type: 'element',
      portMap: { a: { color: 'red', cx: 1, cy: 1 } },
    } as any);
    expect(out.ports).toBeDefined();
  });
});

describe('presets / element-ports', () => {
  it('rect shape', () => {
    const port = elementPort({ shape: 'rect', cx: 0, cy: 0 });
    expect((port.markup?.[0] as { tagName: string }).tagName).toBe('rect');
  });
  it('path shape', () => {
    const port = elementPort({ shape: 'M 0 0 L 10 10', cx: 0, cy: 0 });
    expect((port.markup?.[0] as { tagName: string }).tagName).toBe('path');
  });
  it('label path', () => {
    const port = elementPort({ label: 'hi', cx: 0, cy: 0 });
    expect(port.label).toBeDefined();
    expect((port.label as any).markup).toBeDefined();
  });
  it('elementPorts merges portStyle into each port', () => {
    const out = elementPorts({ a: { cx: 0, cy: 0 } }, { color: 'blue' });
    expect(out.items.length).toBe(1);
    expect(out.groups).toBeDefined();
  });
});

describe('presets / interactive', () => {
  it('function form wraps via native callback', () => {
    const cb = jest.fn(() => true);
    const native = toNativeInteractive(cb);
    const fakePaper = { model: {} } as any;
    const cellView = { model: { id: 'm' } } as any;
    expect((native as any).call(fakePaper, cellView, 'elementMove')).toBe(true);
    expect(cb).toHaveBeenCalled();
  });
  it('boolean passes through', () => {
    expect(toNativeInteractive(true)).toBe(true);
  });
  it('object form merges defaults', () => {
    const out = toNativeInteractive({ elementMove: false } as any);
    expect((out as any).elementMove).toBe(false);
    expect((out as any).labelMove).toBe(false);
  });
  it('undefined returns defaults', () => {
    const noInteractive: undefined = undefined;
    const out = toNativeInteractive(noInteractive);
    expect((out as any).labelMove).toBe(false);
  });
});

describe('presets / link-attributes', () => {
  it('throws on non-object input', () => {
    expect(() => linkAttributes(null as any)).toThrow();
  });
  it('throws when both labelMap and labels provided', () => {
    expect(() =>
      linkAttributes({
        type: 'link',
        labelMap: { a: { text: 'x' } },
        labels: [{ position: 0.5 }],
      } as any)
    ).toThrow();
  });
  it('passes through labels when only labels provided', () => {
    const out = linkAttributes({ type: 'link', labels: [{ position: 0.5 }] } as any);
    expect(out.labels).toEqual([{ position: 0.5 }]);
  });
  it('applies style when provided', () => {
    const out = linkAttributes({ type: 'link', style: { color: 'red' } } as any);
    expect(out.attrs).toBeDefined();
  });
});

describe('presets / link-style', () => {
  it('linkStyleLine with markers', () => {
    const out = linkStyleLine({ sourceMarker: 'arrow', targetMarker: 'arrow' });
    expect(out?.sourceMarker).toBeDefined();
    expect(out?.targetMarker).toBeDefined();
  });
  it('linkStyleLine without markers', () => {
    const out = linkStyleLine({});
    expect(out?.sourceMarker).toBeUndefined();
    expect(out?.targetMarker).toBeUndefined();
  });
  it('linkStyleLine empty default uses CSS variable for marker', () => {
    const out = linkStyleLine({ sourceMarker: 'arrow' });
    expect((out?.sourceMarker as any).attrs.stroke).toContain('--jj-link-color');
  });
  it('linkStyleWrapper builds wrapper attrs', () => {
    const out = linkStyleWrapper({ wrapperClassName: 'hi' });
    expect(out?.class).toContain('hi');
  });
  it('linkStyle returns line + wrapper', () => {
    const out = linkStyle({ color: '#000' });
    expect(out.line).toBeDefined();
    expect(out.wrapper).toBeDefined();
  });
});

describe('presets / utils', () => {
  it('getMarkerLength returns 0 when no attrs', () => {
    const linkView = { model: { attributes: {} } } as any;
    expect(getMarkerLength(linkView, 'source')).toBe(0);
  });
  it('getMarkerLength reads marker length', () => {
    const linkView = {
      model: { attributes: { attrs: { line: { sourceMarker: { length: 7 } } } } },
    } as any;
    expect(getMarkerLength(linkView, 'source')).toBe(7);
  });
  it('getMarkerLength target end', () => {
    const linkView = {
      model: { attributes: { attrs: { line: { targetMarker: { length: 4 } } } } },
    } as any;
    expect(getMarkerLength(linkView, 'target')).toBe(4);
  });
  it('getMarkerLength returns 0 when marker missing', () => {
    const linkView = { model: { attributes: { attrs: { line: {} } } } } as any;
    expect(getMarkerLength(linkView, 'source')).toBe(0);
  });
});

describe('presets / can-embed', () => {
  it('canEmbed default returns true', () => {
    const function_ = canEmbed();
    expect((function_ as any)()).toBe(true);
  });
  it('canEmbed runs validator', () => {
    const validate = jest.fn(() => false);
    const function_ = canEmbed(validate);
    const childView = { model: { id: 'a' }, paper: { model: {} } } as any;
    const parentView = { model: { id: 'b' }, paper: { model: {} } } as any;
    expect((function_ as any)(childView, parentView)).toBe(false);
    expect(validate).toHaveBeenCalled();
  });
  it('canUnembed default returns true', () => {
    const function_ = canUnembed();
    expect((function_ as any)()).toBe(true);
  });
  it('canUnembed runs validator', () => {
    const validate = jest.fn(() => true);
    const function_ = canUnembed(validate);
    const childView = { model: { id: 'a' }, paper: { model: {} } } as any;
    expect((function_ as any)(childView)).toBe(true);
    expect(validate).toHaveBeenCalled();
  });
});

describe('presets / paper module', () => {
  it('importing presets/paper does not throw', async () => {
    const module_ = await import('../paper');
    expect(module_.Paper).toBeDefined();
    expect(module_.DEFAULT_HIGHLIGHTING).toBeDefined();
    // grid pattern mutation happened on import; existence is the signal
    const patterns = (dia.Paper as any).gridPatterns;
    expect(patterns).toBeDefined();
  });
});
