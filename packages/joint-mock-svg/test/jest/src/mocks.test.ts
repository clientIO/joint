import { describe, it, expect, jest } from '@jest/globals';
import type { MockedSVGElement } from '@joint/mock-svg';

const NS = 'http://www.w3.org/2000/svg';

const svg = () => document.createElementNS(NS, 'svg') as SVGSVGElement;
const rect = () => document.createElementNS(NS, 'rect') as SVGRectElement;

describe('SVGPathElement', () => {

    it('is assigned, so a consumer can redefine or delete it', () => {
        expect(Object.getOwnPropertyDescriptor(globalThis, 'SVGPathElement'))
            .toMatchObject({ writable: true, configurable: true, enumerable: true });
    });
});

describe('ResizeObserver', () => {

    it('gives each instance its own methods', () => {
        const a = new ResizeObserver(() => {});
        const b = new ResizeObserver(() => {});
        expect(a.observe).not.toBe(b.observe);
        expect(a.observe).not.toBe(a.unobserve);
    });
});

describe('createSVGMatrix()', () => {

    it('returns a fresh matrix from every operation, so chains resolve', () => {
        const m = svg().createSVGMatrix();
        const operations = [
            m.flipX(), m.flipY(), m.inverse(), m.multiply(), m.rotate(),
            m.rotateFromVector(), m.scale(), m.scaleNonUniform(), m.skewX(),
            m.skewY(), m.translate(),
        ];
        for (const result of operations) expect(result).toMatchObject({ a: 0, f: 0 });
        expect(m.rotate().translate().multiply().inverse()).toMatchObject({ a: 0 });
    });

    it('gives each operation its own function', () => {
        const m = svg().createSVGMatrix();
        expect(m.flipX).not.toBe(m.rotate);
        expect(m.flipX).not.toBe(svg().createSVGMatrix().flipX);
    });
});

describe('createSVGTransform()', () => {

    it('carries a matrix, not a bare object', () => {
        expect(svg().createSVGTransform().matrix).toMatchObject({ a: 0, f: 0 });
    });

    it('gives each setter its own function', () => {
        const t = svg().createSVGTransform();
        expect(t.setMatrix).not.toBe(t.setRotate);
        expect(t.setSkewX).not.toBe(t.setSkewY);
    });
});

describe('createSVGPoint()', () => {

    it('transforms into another point, so chains resolve', () => {
        const p = svg().createSVGPoint();
        expect(p.matrixTransform().matrixTransform()).toMatchObject({ x: 0, y: 0 });
    });

    it('gives each point its own `matrixTransform`', () => {
        expect(svg().createSVGPoint().matrixTransform)
            .not.toBe(svg().createSVGPoint().matrixTransform);
    });
});

describe('getScreenCTM()', () => {

    it('returns an invertible matrix on any SVG element, not only graphics ones', () => {
        // Mocked on `SVGElement.prototype` on purpose: in JSDOM a `<rect>` is not
        // an `SVGGraphicsElement`, so the spec-correct home would miss it.
        expect(rect().getScreenCTM()?.inverse()).toMatchObject({ a: 0 });
        const defs = document.createElementNS(NS, 'defs') as SVGDefsElement;
        expect(defs.getScreenCTM()).toMatchObject({ a: 0 });
    });
});

describe('checkVisibility()', () => {

    it('follows `getBBox`, so a sized element counts as visible', () => {
        const spy = jest.spyOn(SVGElement.prototype as MockedSVGElement, 'getBBox')
            .mockReturnValue({ x: 0, y: 0, width: 10, height: 10 } as DOMRect);
        expect(rect().checkVisibility()).toBe(true);
        spy.mockRestore();
        expect(rect().checkVisibility()).toBe(false);
    });
});

describe('transform.baseVal', () => {

    it('returns a transform from every member that produces one', () => {
        const { baseVal } = rect().transform;
        const t = svg().createSVGTransform();
        const results = [
            baseVal.appendItem(t), baseVal.consolidate(), baseVal.getItem(0),
            baseVal.initialize(t), baseVal.insertItemBefore(t, 0),
            baseVal.removeItem(0), baseVal.replaceItem(t, 0),
            baseVal.createSVGTransformFromMatrix(),
        ];
        for (const result of results) expect(result).toMatchObject({ type: 0, angle: 0 });
    });

    it('gives each member its own function', () => {
        const { baseVal } = rect().transform;
        expect(baseVal.appendItem).not.toBe(baseVal.consolidate);
        expect(baseVal.initialize).not.toBe(baseVal.replaceItem);
    });
});
