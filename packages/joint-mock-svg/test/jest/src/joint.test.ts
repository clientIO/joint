import { dia, shapes, elementTools, V } from '@joint/core';
import type { MockedSVGElement } from '@joint/mock-svg';

const buildPaper = () => {

    const graph = new dia.Graph({}, { cellNamespace: shapes });

    const paper = new dia.Paper({
        model: graph,
        background: { color: '#F8F9FA' },
        sorting: dia.Paper.sorting.APPROX,
        cellViewNamespace: shapes,
    });

    document.body.appendChild(paper.el);

    const rect = new shapes.standard.Rectangle({
        position: { x: 100, y: 100 },
        size: { width: 100, height: 50 },
        attrs: {
            label: {
                text: 'Hello World',
                // Exercises `getBBox` and `getComputedTextLength`, which
                // `util.breakText()` measures with.
                textWrap: {
                    width: 'calc(w - 20)',
                    height: 'calc(h - 20)',
                    ellipsis: true,
                },
            },
        },
    });

    graph.addCell(rect);

    return { graph, paper, rect };
};

describe('a real JointJS paper', () => {

    // `dia.CellView` measures a node only when `checkVisibility()` is true, and
    // the mocked `checkVisibility` reads the mocked `getBBox`, which is empty.
    // Left alone, every measurement is skipped with a warning. Giving `getBBox`
    // a size - the customization `customizations.test.ts` demonstrates - is what
    // a consumer does, and it puts the measuring code paths back in play.
    beforeEach(() => {
        jest.spyOn(SVGElement.prototype as MockedSVGElement, 'getBBox')
            .mockReturnValue({ x: 0, y: 0, width: 100, height: 50 } as DOMRect);
    });
    afterEach(() => jest.restoreAllMocks());

    it('renders an element', () => {
        const { paper } = buildPaper();
        expect(document.querySelector('.joint-paper')).not.toBeNull();
        expect(document.querySelector('.joint-element')).not.toBeNull();
        paper.remove();
    });

    it('survives the tools, matrix and transform-list paths', () => {
        const { paper, rect } = buildPaper();
        const rectView = rect.findView(paper) as dia.ElementView;

        rectView.addTools(new dia.ToolsView({
            tools: [
                new elementTools.Boundary({ padding: 10 }),
                new elementTools.Remove(),
            ],
        }));

        expect(() => {
            // `createSVGPoint`, `createSVGMatrix` and `transform.baseVal`.
            rectView.vel.translateAndAutoOrient({ x: 10, y: 10 }, { x: 100, y: 100 }, paper.svg);
            rectView.vel.transform();
            // `getScreenCTM`, which JointJS inverts to map client coordinates.
            (rectView.el as SVGGElement).getScreenCTM()?.inverse();
            V.transformStringToMatrix('matrix(1, 0, 0, 1, 10, 20)');
        }).not.toThrow();

        // The boundary tool measures the element before drawing itself, a path
        // only reached because `getBBox` reports a size.
        expect(paper.el.querySelector('.joint-tool[data-tool-name="boundary"]')).not.toBeNull();

        paper.remove();
    });

    it('wraps label text without measuring anything', () => {
        const { paper, rect } = buildPaper();
        // `breakText` asks `getComputedTextLength` for a width of 0, so every
        // word "fits" - the point is that it completes rather than throws.
        expect(rect.findView(paper).el.querySelector('text')).not.toBeNull();
        paper.remove();
    });
});
