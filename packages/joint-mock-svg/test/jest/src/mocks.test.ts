import type { MockedSVGElement } from '@joint/mock-svg';

const NS = 'http://www.w3.org/2000/svg';

const svg = () => document.createElementNS(NS, 'svg') as SVGSVGElement;
const rect = () => document.createElementNS(NS, 'rect') as SVGRectElement;
const text = () => document.createElementNS(NS, 'text') as SVGTextElement;

describe('SVGPathElement', () => {

    it('is defined and constructible', () => {
        expect(typeof globalThis.SVGPathElement).toBe('function');
        expect(typeof new SVGPathElement()).toBe('object');
    });

    it('is assigned, so a consumer can redefine or delete it', () => {
        expect(Object.getOwnPropertyDescriptor(globalThis, 'SVGPathElement'))
            .toMatchObject({ writable: true, configurable: true, enumerable: true });
    });
});

describe('SVGAngle', () => {

    it('exposes the unit constants Vectorizer checks for', () => {
        expect(new SVGAngle()).toMatchObject({
            SVG_ANGLETYPE_UNKNOWN: 0,
            SVG_ANGLETYPE_UNSPECIFIED: 1,
            SVG_ANGLETYPE_DEG: 2,
            SVG_ANGLETYPE_RAD: 3,
            SVG_ANGLETYPE_GRAD: 4,
        });
    });

    it('is truthy, which is all `V.isSVGSupported` asks of it', () => {
        expect(globalThis.SVGAngle).toBeTruthy();
    });
});

describe('ResizeObserver', () => {

    it('constructs and exposes the three observer methods', () => {
        const observer = new ResizeObserver(() => {});
        expect(typeof observer.observe).toBe('function');
        expect(typeof observer.unobserve).toBe('function');
        expect(typeof observer.disconnect).toBe('function');
        expect(() => {
            observer.observe(document.body);
            observer.unobserve(document.body);
            observer.disconnect();
        }).not.toThrow();
    });

    it('never invokes its callback', () => {
        const callback = jest.fn();
        new ResizeObserver(callback).observe(document.body);
        expect(callback).not.toHaveBeenCalled();
    });

    it('gives each instance its own methods', () => {
        const a = new ResizeObserver(() => {});
        const b = new ResizeObserver(() => {});
        expect(a.observe).not.toBe(b.observe);
        expect(a.observe).not.toBe(a.unobserve);
    });
});

describe('createSVGMatrix()', () => {

    it('returns a zeroed matrix', () => {
        expect(svg().createSVGMatrix()).toMatchObject({ a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 });
    });

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

    it('returns a transform carrying a matrix and the type constants', () => {
        expect(svg().createSVGTransform()).toMatchObject({
            type: 0,
            angle: 0,
            SVG_TRANSFORM_UNKNOWN: 0,
            SVG_TRANSFORM_MATRIX: 1,
            SVG_TRANSFORM_TRANSLATE: 2,
            SVG_TRANSFORM_SCALE: 3,
            SVG_TRANSFORM_ROTATE: 4,
            SVG_TRANSFORM_SKEWX: 5,
            SVG_TRANSFORM_SKEWY: 6,
        });
        expect(svg().createSVGTransform().matrix).toMatchObject({ a: 0, f: 0 });
    });

    it('accepts every setter without throwing', () => {
        const t = svg().createSVGTransform();
        expect(() => {
            t.setMatrix(svg().createSVGMatrix());
            t.setRotate(45, 0, 0);
            t.setScale(2, 2);
            t.setSkewX(10);
            t.setSkewY(10);
            t.setTranslate(5, 5);
        }).not.toThrow();
    });

    it('gives each setter its own function', () => {
        const t = svg().createSVGTransform();
        expect(t.setMatrix).not.toBe(t.setRotate);
        expect(t.setSkewX).not.toBe(t.setSkewY);
    });
});

describe('createSVGPoint()', () => {

    it('returns the origin and transforms into another point', () => {
        const p = svg().createSVGPoint();
        expect(p).toMatchObject({ x: 0, y: 0 });
        expect(p.matrixTransform()).toMatchObject({ x: 0, y: 0 });
        expect(p.matrixTransform().matrixTransform()).toMatchObject({ x: 0, y: 0 });
    });

    it('gives each point its own `matrixTransform`', () => {
        expect(svg().createSVGPoint().matrixTransform)
            .not.toBe(svg().createSVGPoint().matrixTransform);
    });
});

describe('getComputedTextLength()', () => {

    it('measures every string as zero', () => {
        const label = text();
        label.textContent = 'Hello World';
        expect(label.getComputedTextLength()).toBe(0);
    });
});

describe('getScreenCTM()', () => {

    it('returns an invertible matrix on any SVG element, not only graphics ones', () => {
        expect(rect().getScreenCTM()).toMatchObject({ a: 0, f: 0 });
        expect(rect().getScreenCTM()?.inverse()).toMatchObject({ a: 0 });
        const defs = document.createElementNS(NS, 'defs') as SVGDefsElement;
        expect(defs.getScreenCTM()).toMatchObject({ a: 0 });
    });
});

describe('getBBox()', () => {

    it('returns an all-zero rect', () => {
        expect(rect().getBBox()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
});

describe('checkVisibility()', () => {

    it('is false while the bounding box is empty', () => {
        expect(rect().checkVisibility()).toBe(false);
    });

    it('follows `getBBox`, so a sized element counts as visible', () => {
        const spy = jest.spyOn(SVGElement.prototype as MockedSVGElement, 'getBBox')
            .mockReturnValue({ x: 0, y: 0, width: 10, height: 10 } as DOMRect);
        expect(rect().checkVisibility()).toBe(true);
        spy.mockRestore();
        expect(rect().checkVisibility()).toBe(false);
    });
});

describe('transform.baseVal', () => {

    it('reports an empty list', () => {
        const { baseVal } = rect().transform;
        expect(baseVal.numberOfItems).toBe(0);
        expect(baseVal.length).toBe(0);
    });

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

    it('clears without throwing', () => {
        expect(() => rect().transform.baseVal.clear()).not.toThrow();
    });

    it('gives each member its own function', () => {
        const { baseVal } = rect().transform;
        expect(baseVal.appendItem).not.toBe(baseVal.consolidate);
        expect(baseVal.initialize).not.toBe(baseVal.replaceItem);
    });
});
