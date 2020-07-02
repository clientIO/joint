import * as joint from '../../../build/joint';

export const Custom = joint.shapes.standard.Rectangle.define('app.Custom', {
    z: 1,
    attrs: {
        body: {
            fill: 'rgba(70,101,229,0.15)',
            stroke: '#4665E5',
            rx: 2,
            ry: 2,
        }
    },
    ports: {
        groups: {
            port: {
                position: {
                    name: 'absolute'
                },
                attrs: {
                    portBody: {
                        magnet: 'passive',
                        refWidth: '100%',
                        refHeight: '100%',
                        fill: '#4665E5'
                    }
                },
                markup: [{
                        tagName: 'rect',
                        selector: 'portBody'
                    }]
            }
        }
    }
});

export const Label = joint.dia.Element.define('app.Label', {
    attrs: {
        label: {
            fontSize: 10,
            fontFamily: 'sans-serif',
            textAnchor: 'start'
        }
    }
}, {
    markup: [{
            tagName: 'text',
            selector: 'label'
        }]
});

export const Link = joint.dia.Link.define('Link', {
    z: 2,
    attrs: {
        root: {
            cursor: 'pointer'
        },
        line: {
            fill: 'none',
            connection: true,
            stroke: '#464454',
            strokeWidth: 1
        },
        arrowhead: {
            d: 'M -5 -2.5 0 0 -5 2.5 Z',
            stroke: '#464454',
            fill: '#464454',
            atConnectionRatio: 1,
            strokeWidth: 1
        }
    }
}, {
    markup: [{
            tagName: 'path',
            selector: 'line'
        }, {
            tagName: 'path',
            selector: 'arrowhead'
        }]
});
