import * as joint from '../../../build/joint';

export const Child = joint.shapes.standard.Rectangle.define('app.Child', {
    z: 1,
    attrs: {
        body: {
            fill: 'rgba(70,101,229,0.15)',
            stroke: '#4665E5',
            strokeWidth: 1,
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
    z: 3,
    attrs: {
        label: {
            fontFamily: 'sans-serif'
        }
    }
}, {
    markup: [{
        tagName: 'text',
        selector: 'label'
    }]
});

export const Edge = joint.dia.Link.define('app.Edge', {
    z: 2,
    attrs: {
        root: {
            cursor: 'pointer'
        },
        line: {
            fill: 'none',
            connection: true,
            stroke: '#464454',
            strokeWidth: 1,
            targetMarker: { 'd': 'M 5 2.5 0 0 5 -2.5 Z' }
        }
    }
}, {
    markup: [{
        tagName: 'path',
        selector: 'line'
    }]
});
