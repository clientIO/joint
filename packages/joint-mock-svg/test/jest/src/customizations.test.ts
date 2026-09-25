import { describe, it, expect, afterEach, jest } from '@jest/globals';
import type { MockedSVGElement } from '@joint/mock-svg';

const NS = 'http://www.w3.org/2000/svg';

const svg = () => document.createElementNS(NS, 'svg') as SVGSVGElement;
const rect = () => document.createElementNS(NS, 'rect') as SVGRectElement;
const text = () => document.createElementNS(NS, 'text') as SVGTextElement;

afterEach(() => { jest.restoreAllMocks(); });

describe('changing what a mock returns', () => {

    it('gives `getBBox` a size for the test that needs one', () => {
        jest.spyOn(SVGElement.prototype as MockedSVGElement, 'getBBox')
            .mockReturnValue({ x: 0, y: 0, width: 100, height: 20 } as DOMRect);
        expect(rect().getBBox()).toMatchObject({ width: 100, height: 20 });
    });

    it('restores the mock afterwards, so the override stays local', () => {
        // The previous test overrode `getBBox`; `restoreAllMocks` in `afterEach`
        // put the package's own mock back rather than leaving a dead spy.
        expect(rect().getBBox()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
});

describe('asserting on a mock', () => {

    it('records calls', () => {
        const getBBox = jest.spyOn(SVGElement.prototype as MockedSVGElement, 'getBBox');
        rect().getBBox();
        expect(getBBox).toHaveBeenCalled();
    });

    it('reaches nested members', () => {
        const appendItem = jest.spyOn((SVGElement.prototype as MockedSVGElement).transform.baseVal, 'appendItem');
        const transform = svg().createSVGTransform();
        rect().transform.baseVal.appendItem(transform);
        expect(appendItem).toHaveBeenCalledWith(transform);
    });
});

describe('swapping an implementation permanently', () => {

    it('takes a plain assignment, and the caller restores it', () => {
        const original = (SVGElement.prototype as MockedSVGElement).getComputedTextLength;
        (SVGElement.prototype as MockedSVGElement).getComputedTextLength = () => 42;
        expect(text().getComputedTextLength()).toBe(42);
        (SVGElement.prototype as MockedSVGElement).getComputedTextLength = original;
        expect(text().getComputedTextLength()).toBe(0);
    });
});

describe('driving ResizeObserver', () => {

    it('needs a replacement, since the mocked one never calls back', () => {
        const ignored = jest.fn();
        new ResizeObserver(ignored).observe(document.body);
        expect(ignored).not.toHaveBeenCalled();

        const original = globalThis.ResizeObserver;

        class TestResizeObserver {
            observe = jest.fn();
            unobserve = jest.fn();
            disconnect = jest.fn();
            constructor(private callback: ResizeObserverCallback) {}
            resize(entries: ResizeObserverEntry[]) {
                this.callback(entries, this as unknown as ResizeObserver);
            }
        }
        globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

        const callback = jest.fn();
        const observer = new TestResizeObserver(callback);
        observer.observe(document.body);
        observer.resize([{ contentRect: { width: 10, height: 10 }} as ResizeObserverEntry]);

        expect(observer.observe).toHaveBeenCalledWith(document.body);
        expect(callback).toHaveBeenCalledTimes(1);

        globalThis.ResizeObserver = original;
    });
});
