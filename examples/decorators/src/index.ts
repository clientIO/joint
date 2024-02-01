import { g, dia, shapes } from '@joint/core';
import { Model, View, On, SVGAttribute, Function } from '@joint/decorators';

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
            width: 140,
            height: 100
        },
        color: '#FF0000',
        textColor: '#333333',
        title: 'mr.',
        firstName: 'peter',
        lastName: 'kruder',
    },
    template: `
        <title>My Element</title>
        <rect @selector="body"
            x="0"
            y="0"
            width="calc(w)"
            height="calc(h)"
            line-style="solid"
            stroke-width="2"
            :fill="lighten(color, 0.2)"
            :stroke="color"
        />
        <text @selector="label"
            text-anchor="middle"
            text-vertical-anchor="middle"
            font-size="14"
            font-family="sans-serif"
            x="calc(0.5*w)"
            y="calc(0.5*h)"
            :fill="textColor"
        >{{ capitalize(firstName) }} {{ capitalize(lastName) }}</text>
    `,
})
class MyElement extends dia.Element {

    @SVGAttribute('line-style')
    setLineStyleAttribute(this: dia.CellView, lineStyle: string, _refBBox: g.Rect, _node: SVGElement, attrs: any) {
        const n = attrs.strokeWidth || 1;
        const dasharray = {
            'dashed': `${4*n},${2*n}`,
            'dotted': `${n},${n}`
        }[lineStyle] || 'none';
        return { 'stroke-dasharray': dasharray };
    }

    @Function()
    capitalize(value: string) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    @Function()
    lighten(col: string, percentage: number = 0) {
        return shadeHexColor(col, percentage);
    }

}

@View({
    namespace: shapeNamespace,
    models: [MyElement]
})
class MyElementView extends dia.ElementView {

    @On('click')
    onClick() {
        console.log('click!', this.model.id);
    }

}

graph.fromJSON({
    cells: [{
        type: 'MyElement',
        position: { x: 50, y: 50 },
        color: '#2F215A',
        textColor: '#FFFFFF',
        attrs: {
            body: {
                lineStyle: 'dotted'
            }
        }
    }]
});

const el1 = new MyElement({
    position: { x: 200, y: 200 },
    lastName: 'dorfmeister',
    attrs: {
        body: {
            lineStyle: 'dashed'
        }
    }
});
el1.addTo(graph);

el1.set({
    color: '#A9198C',
    firstName: 'richard',
    textColor: '#FFFFFF'
});

paper.unfreeze();

function shadeHexColor(color, percent) {
    const f = parseInt(color.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * -1 : percent;
    const R = f>>16;
    const G = f>>8&0x00FF;
    const B = f&0x0000FF;
    return "#" + (0x1000000+(Math.round((t-R)*p)+R)*0x10000 + (Math.round((t-G)*p)+G)*0x100 + (Math.round((t-B)*p)+B)).toString(16).slice(1);
}
