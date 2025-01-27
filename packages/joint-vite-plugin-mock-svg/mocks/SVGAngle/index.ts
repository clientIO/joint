import { vi } from 'vitest';

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
