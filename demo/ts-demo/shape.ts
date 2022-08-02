import { shapes, dia, util } from './vendor/joint';

export class MyShape extends dia.Element {

    defaults() {
        return {
            ...super.defaults,
            type: 'myNamespace.MyShape',
            size: { width: 100, height: 80 },
            attrs: {
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    rx: 'calc(w / 2)',
                    ry: 'calc(h / 2)',
                    strokeWidth: 2,
                    stroke: '#333333',
                    fill: '#FFFFFF'
                },
                label: {
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    x: 'calc(w / 2)',
                    y: 'calc(h / 2)',
                    fontSize: 14,
                    fill: '#333333'
                }
            }
        }
    }

    markup = [{
        tagName: 'ellipse',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }]

    test(): void {
        console.log(`A prototype method test for ${this.get('type')}`);
    }

    static staticTest(i: number): void {
        console.log(`A static method test with an argument: ${i}`);
    }
}

util.assign(shapes, {
    myNamespace: {
        MyShape
    }
});

/*
// Alternatively without an injection
const myShapes = {
    myNamespace: { MyShape },
    standard: joint.shapes.standard
}
new joint.dia.Graph({}, { cellNamespace: myShapes });
new joint.dia.Paper({ cellViewNamespace: myShapes });
*/
