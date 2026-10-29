type AssertExtends<A,B> = A extends B ? true : never;

import * as joint from '../../';

// Extending the `joint.shapes` namespace with custom shapes
/* eslint-disable @typescript-eslint/no-namespace */
declare module '../../' {
    namespace shapes {
        namespace tsTest {
            class CustomRect extends joint.shapes.standard.Rectangle {
                test(): void;
                static staticTest(): void;
            }
            class Link extends joint.dia.Link {
            }
            class CustomRectView extends joint.dia.ElementView {
            }
        }
    }
}
/* eslint-enable @typescript-eslint/no-namespace */

const Link = joint.shapes.standard.Link.define('tsTest.Link', {
    attrs: {
        line: {
            stroke: '#222138',
            strokeWidth: 1
        }
    }
});

// `define()` with prototype and static properties
const CustomRect = joint.shapes.standard.Rectangle.define('tsTest.CustomRect', {
    attrs: {
        body: {
            fill: 'red'
        }
    }
}, {
    test: function() {
        return;
    }
}, {
    staticTest: function() {
        return;
    }
});

class CustomRectView extends joint.dia.ElementView {
}

Object.assign(joint.shapes, {
    tsTest: {
        Link,
        CustomRect,
        CustomRectView
    }
});

const customRect = new joint.shapes.tsTest.CustomRect().position(80, 60).size(100, 100);
customRect.test();
joint.shapes.tsTest.CustomRect.staticTest();
const isRectangle: AssertExtends<typeof customRect, joint.shapes.standard.Rectangle> = true;

// A shape defined as an ES6 class
class MyShape extends joint.dia.Element {

    defaults() {
        return {
            ...super.defaults,
            type: 'tsTest.MyShape',
            size: { width: 100, height: 80 },
            attrs: {
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    rx: 'calc(w / 2)',
                    ry: 'calc(h / 2)'
                },
                label: {
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    x: 'calc(w / 2)',
                    y: 'calc(h / 2)'
                }
            }
        };
    }

    markup = [{
        tagName: 'ellipse',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }];

    test(): string {
        return this.get('type');
    }

    static staticTest(i: number): number {
        return i;
    }
}

const myShape = new MyShape({ attrs: { label: { text: 'My Shape' }}});
const isString: AssertExtends<ReturnType<typeof myShape.test>, string> = true;
MyShape.staticTest(2);

// A namespace without an injection into `joint.shapes`
const cellNamespace = {
    tsTest: { MyShape },
    standard: joint.shapes.standard
};

const graph = new joint.dia.Graph({}, { cellNamespace });
const paper = new joint.dia.Paper({
    model: graph,
    cellViewNamespace: cellNamespace,
    frozen: true,
    async: true,
    markAvailable: true,
    defaultLink: new joint.shapes.tsTest.Link(),
    connectionStrategy: joint.connectionStrategies.pinAbsolute
});

graph.addCells([customRect, myShape]);

new joint.shapes.standard.Link()
    .source(customRect, {
        anchor: { name: 'bottomLeft' },
        connectionPoint: { name: 'boundary', args: { offset: 5 }}
    })
    .target(myShape, {
        anchor: { name: 'bottomLeft' },
        connectionPoint: { name: 'boundary', args: { offset: 5 }}
    })
    .router('manhattan', { step: 20 })
    .connector('rounded', { radius: 20 })
    .addTo(graph);

// Highlighters
const myShapeView = myShape.findView(paper);

const highlighter = joint.dia.HighlighterView.add(myShapeView, 'body', 'my-id1');
highlighter.remove();

const { mask } = joint.highlighters;
const m1 = mask.add(myShapeView, { selector: 'body' }, 'my-id2', <joint.highlighters.MaskHighlighterArguments>{
    layer: joint.dia.Paper.Layers.FRONT,
    maskClip: 10,
    padding: 5
});
const m2 = mask.get(myShapeView, 'my-id2');
const isMask: AssertExtends<typeof m1, joint.highlighters.mask> = true;
const maskId: string | undefined = m2?.getMaskId();
mask.add(myShapeView, 'root', 'my-id3');
mask.remove(myShapeView, 'my-id3');
