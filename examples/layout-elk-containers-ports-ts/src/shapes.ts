import { shapes, util } from '@joint/core';

const PORT_SIZE = { width: 12, height: 12 };
const PORT_ATTRS = {
    circle: {
        r: 6,
        cx: 6,
        cy: 6,
        fill: '#FFFFFF',
        stroke: '#333',
        strokeWidth: 2
    },
    text: {
        fontSize: 14,
        fill: '#555'
    }
};

const PORT_LABEL = {
    position: {
        name: 'outside'
    }
};

// Square ports (rather than `PORT_ATTRS`' circles) set `HubService` apart as
// a hub with several ports fanning in/out on the same side.
const HUB_PORT_SIZE = { width: 14, height: 14 };
const HUB_PORT_MARKUP = [{
    tagName: 'rect',
    selector: 'rect'
}];
const HUB_PORT_ATTRS = {
    rect: {
        width: HUB_PORT_SIZE.width,
        height: HUB_PORT_SIZE.height,
        fill: '#FFFFFF',
        stroke: '#B85C38',
        strokeWidth: 2
    },
    text: {
        fontSize: 14,
        fill: '#555'
    }
};

/**
 * A dashed, semi-transparent container - its final size and position are
 * computed by ELK to fit whatever gets embedded into it. Its label sits in
 * the top-left corner, out of the way of embedded elements.
 */
export class Container extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Container',
            size: { width: 100, height: 100 },
            attrs: {
                body: {
                    fill: '#EEF3F1',
                    stroke: '#7C9C92',
                    strokeWidth: 2,
                    strokeDasharray: '6,3',
                    rx: 8,
                    ry: 8
                },
                label: {
                    x: 12,
                    y: 10,
                    textAnchor: 'start',
                    textVerticalAnchor: 'top',
                    fontWeight: 'bold',
                    fontSize: 13,
                    fill: '#3E5C53',
                    fontFamily: 'Arial, helvetica, sans-serif'
                }
            }
        }, super.defaults);
    }
}

/**
 * A service node with exactly one 'in' (left) and one 'out' (right) port,
 * always - only `fill` and label `text` are left for each instance to fill
 * in. See `HubService` for a service with a custom number of ports.
 */
export class Service extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Service',
            size: { width: 130, height: 50 },
            attrs: {
                body: {
                    stroke: '#333',
                    strokeWidth: 2,
                    rx: 5,
                    ry: 5
                },
                label: {
                    fill: '#333',
                    fontSize: 13,
                    fontFamily: 'Arial, helvetica, sans-serif'
                }
            },
            ports: {
                groups: {
                    in: {
                        position: 'left',
                        size: PORT_SIZE,
                        attrs: PORT_ATTRS,
                        label: PORT_LABEL
                    },
                    out: {
                        position: 'right',
                        size: PORT_SIZE,
                        attrs: PORT_ATTRS,
                        label: PORT_LABEL
                    }
                },
                items: [
                    { id: 'in', group: 'in', attrs: { text: { text: 'in' } } },
                    { id: 'out', group: 'out', attrs: { text: { text: 'out' } } }
                ]
            }
        }, super.defaults);
    }
}

/**
 * A service with a custom (per-instance) number of ports - `ports.items`
 * always comes from the instance, replacing `Service`'s fixed pair. Also
 * highlighted with a thicker, colored stroke, to stand out as a hub with
 * several ports fanning in/out on the same side.
 */
export class HubService extends Service {
    defaults() {
        // `super.defaults` (unlike extending a built-in `shapes.standard.*`
        // class, whose `defaults` is a plain object) is a method here too -
        // it must be called to get the merged object, not just referenced.
        return util.defaultsDeep({
            type: 'example.HubService',
            attrs: {
                body: {
                    stroke: '#B85C38',
                    strokeWidth: 3
                }
            },
            ports: {
                groups: {
                    in: {
                        markup: HUB_PORT_MARKUP,
                        size: HUB_PORT_SIZE,
                        attrs: HUB_PORT_ATTRS
                    },
                    out: {
                        markup: HUB_PORT_MARKUP,
                        size: HUB_PORT_SIZE,
                        attrs: HUB_PORT_ATTRS
                    }
                }
            }
        }, super.defaults());
    }
}

/**
 * A link with a labelled, pill-shaped background - only the label `text`
 * is left for each instance to fill in.
 */
export class InteractionLink extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'example.InteractionLink',
            defaultLabel: {
                size: { width: 80, height: 20 },
                attrs: {
                    text: {
                        fontSize: 11,
                        fontFamily: 'Arial, helvetica, sans-serif',
                        fill: '#333'
                    },
                    rect: {
                        ref: null,
                        x: 'calc(x - calc(w / 2))',
                        y: 'calc(y - calc(h / 2))',
                        width: 'calc(w)',
                        height: 'calc(h)',
                        fill: '#FFB7C3',
                        strokeWidth: 1,
                        stroke: '#333'
                    }
                },
                position: 0.5
            }
        }, super.defaults);
    }
}
