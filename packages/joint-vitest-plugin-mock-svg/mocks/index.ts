import { vi } from 'vitest';

// Mock method which is not implemented in JSDOM

globalThis.SVGPathElement = vi.fn();

globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

Object.defineProperty(globalThis, 'SVGAngle', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
        new: vi.fn(),
        prototype: vi.fn(),
        SVG_ANGLETYPE_UNKNOWN: 0,
        SVG_ANGLETYPE_UNSPECIFIED: 1,
        SVG_ANGLETYPE_DEG: 2,
        SVG_ANGLETYPE_RAD: 3,
        SVG_ANGLETYPE_GRAD: 4
    }))
});

const SVGMatrix = ({
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    f: 0,
    flipX: vi.fn().mockImplementation(() => SVGMatrix),
    flipY: vi.fn().mockImplementation(() => SVGMatrix),
    inverse: vi.fn().mockImplementation(() => SVGMatrix),
    multiply: vi.fn().mockImplementation(() => SVGMatrix),
    rotate: vi.fn().mockImplementation(() => SVGMatrix),
    rotateFromVector: vi.fn().mockImplementation(() => SVGMatrix),
    scale: vi.fn().mockImplementation(() => SVGMatrix),
    scaleNonUniform: vi.fn().mockImplementation(() => SVGMatrix),
    skewX: vi.fn().mockImplementation(() => SVGMatrix),
    skewY: vi.fn().mockImplementation(() => SVGMatrix),
    translate: vi.fn().mockImplementation(() => SVGMatrix),
});

Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: vi.fn().mockImplementation(() => SVGMatrix),
});

Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
        x: 0,
        y: 0,
        matrixTransform: vi.fn().mockImplementation(() => ({
            x: 0,
            y: 0,
        })),
    })),
});

Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
        angle: 0,
        matrix: {
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 0,
            f: 0,
            multiply: vi.fn(),
        },
        setMatrix: vi.fn(),
        setTranslate: vi.fn(),
    })),
});
