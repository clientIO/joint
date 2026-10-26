import { dia, shapes, util } from '@joint/core';

export const LABEL_FONT_SIZE = 10;
const PORT_SIZE = 7;

// `@joint/layout-elk` takes a node label's size from the caller rather than
// measuring the rendered text, so it is estimated from the text length up front.
export function estimateLabelSize(text: string): dia.Size {
    return {
        width: Math.ceil(text.length * LABEL_FONT_SIZE * 0.6),
        height: LABEL_FONT_SIZE + 2
    };
}

const portGroup = {
    position: {
        name: 'absolute'
    },
    size: { width: PORT_SIZE, height: PORT_SIZE },
    markup: [{
        tagName: 'rect',
        selector: 'portBody'
    }],
    attrs: {
        portBody: {
            magnet: 'passive',
            x: -PORT_SIZE / 2,
            y: -PORT_SIZE / 2,
            width: PORT_SIZE,
            height: PORT_SIZE,
            fill: '#4665E5'
        }
    }
};

/**
 * An actor with ports on any of its four sides - the port group is the side.
 * Its label sits outside, above the top-left corner, wherever ELK places it.
 */
export class Actor extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Actor',
            z: 1,
            attrs: {
                body: {
                    fill: 'rgba(70,101,229,0.15)',
                    stroke: '#4665E5',
                    strokeWidth: 1,
                    rx: 2,
                    ry: 2
                },
                label: {
                    class: 'outer-label',
                    fontFamily: 'sans-serif',
                    fontSize: LABEL_FONT_SIZE,
                    fill: '#222222',
                    textAnchor: 'start',
                    textVerticalAnchor: 'top'
                }
            },
            ports: {
                groups: {
                    north: portGroup,
                    east: portGroup,
                    south: portGroup,
                    west: portGroup
                }
            }
        }, super.defaults);
    }
}

/**
 * An actor that holds a sub-model of its own - ELK sizes it to fit its children.
 * When zoomed out, its children are hidden and its name is shown inside instead.
 */
export class Composite extends Actor {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Composite',
            size: { width: 100, height: 100 },
            markup: [{
                tagName: 'rect',
                selector: 'body'
            }, {
                tagName: 'text',
                selector: 'label'
            }, {
                tagName: 'text',
                selector: 'innerLabel'
            }],
            attrs: {
                innerLabel: {
                    class: 'inner-label',
                    text: '',
                    x: 'calc(0.5 * w)',
                    y: 'calc(0.5 * h)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontFamily: 'sans-serif',
                    fill: '#4665E5',
                    textWrap: {
                        width: -10,
                        height: -10,
                        ellipsis: true
                    }
                }
            }
        }, super.defaults());
    }
}

export class Edge extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Edge',
            z: 2,
            attrs: {
                line: {
                    stroke: '#464454',
                    strokeWidth: 1,
                    targetMarker: { d: 'M 5 2.5 0 0 5 -2.5 Z' }
                }
            }
        }, super.defaults);
    }
}

/**
 * A dot where links merge - ELK reports these with the layout result, they are not
 * part of the layout input.
 */
export class Junction extends shapes.standard.Circle {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Junction',
            z: 3,
            size: { width: 4, height: 4 },
            attrs: {
                body: {
                    fill: '#464454',
                    stroke: 'none'
                }
            }
        }, super.defaults);
    }
}
