import { dia, shapes } from 'jointjs';
import { Model, View, on } from './decorators';

const shapeNamespace = {
    ...shapes,
}

const graph = new dia.Graph({}, { cellNamespace: shapeNamespace });

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 800,
    model: graph,
    frozen: true,
    async: true,
    defaultLink: () => new shapes.standard.Link(),
    sorting: dia.Paper.sorting.APPROX,
    magnetThreshold: 'onleave',
    linkPinning: false,
    snapLinks: true,
    background: {
        color: '#F3F7F6'
    },
    cellViewNamespace: shapeNamespace
});

paper.el.style.border = `1px solid #e2e2e2`;

@Model({
    namespace: shapeNamespace,
    attributes: {
        size: {
            width: 100,
            height: 100
        },
        primaryColor: 'lightblue',
        secondaryColor: 'red'
    },
    presentation: `
        <g title="Test SVG Markup">
            <rect @selector="body"
                x="0"
                y="0"
                width="calc(w)"
                height="calc(h)"
                [fill]="primaryColor"
                [stroke]="secondaryColor"
                stroke-width="2"
            />
            <text @selector="label"
                text-anchor="middle"
                text-vertical-anchor="middle"
                font-size="14"
                [fill]="secondaryColor"
                text="Hello World!"
                transform="translate(calc(0.5*w),calc(0.5*h))"
            />
        </g>
    `,
})
class TestElement extends dia.Element {

    logType() {
        console.log(this.get('type'));
    }
}


@View({
    namespace: shapeNamespace,
    // model: TestElement
})
class TestElementView extends dia.ElementView {

    @on('click')
    onClick() {
        console.log('click!', this.model.id);
    }

}

graph.fromJSON({
    cells: [{ type: 'TestElement', position: { x: 50, y: 50 }}]
});

const el1 = new TestElement({
    position: { x: 200, y: 200 },
    attrs: {
        label: {
            text: 'Another hello!'
        }
    }
});
el1.addTo(graph);
el1.logType();

el1.set({
    primaryColor: '#fff',
    secondaryColor: '#333'
});

paper.unfreeze();
