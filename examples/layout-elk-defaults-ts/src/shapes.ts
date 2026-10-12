import { shapes, util } from '@joint/core';

const PORT_SIZE = { width: 12, height: 12 };
const PORT_ATTRS = {
    circle: {
        r: 6,
        class: 'md-port'
    },
    text: {
        class: 'md-port-label'
    }
};

/**
 * A tonal container surface - `@joint/layout-elk` sizes and positions it to fit
 * whatever gets embedded into it, entirely through its own default container
 * handling. Its label sits just above the box, so it never has to compete
 * with embedded elements for space inside it.
 */
export class Container extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Container',
            size: { width: 100, height: 100 },
            attrs: {
                body: {
                    class: 'md-container'
                },
                label: {
                    x: 0,
                    y: -8,
                    textAnchor: 'start',
                    textVerticalAnchor: 'bottom',
                    class: 'md-container-label'
                }
            }
        }, super.defaults);
    }
}

/**
 * A service card - each instance declares its own `ports.items` (from none up
 * to several), using a plain 'left'/'right' port group. Port labels are laid
 * out by JointJS itself, not ELK - this example passes no `exportPortLabel`
 * callback to customize that.
 */
export class Service extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Service',
            size: { width: 130, height: 50 },
            attrs: {
                body: {
                    class: 'md-card'
                },
                label: {
                    class: 'md-card-label'
                }
            },
            ports: {
                groups: {
                    // The label sits above the port (not to its side, via `left`/`right`)
                    // so it never lands directly on the horizontal edge segment ELK's
                    // orthogonal routing always draws right up to a left/right port.
                    in: {
                        position: 'left',
                        label: {
                            position: {
                                name: 'outside',
                                args: {
                                    y: 10
                                }
                            }
                        },
                        size: PORT_SIZE,
                        attrs: PORT_ATTRS
                    },
                    out: {
                        position: 'right',
                        label: {
                            position: {
                                name: 'outside',
                                args: {
                                    y: 10
                                }
                            }
                        },
                        size: PORT_SIZE,
                        attrs: PORT_ATTRS
                    }
                }
            }
        }, super.defaults);
    }
}

/**
 * A link with a labelled, pill-shaped Material "assist chip" - ELK positions
 * the label on its own, since this example passes no `exportLinkLabel`
 * callback to customize it.
 */
export class InteractionLink extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'example.InteractionLink',
            attrs: {
                // A CSS class alone can't color this: the arrowhead is a separate
                // `<marker>` def whose own color JointJS derives from this `stroke`
                // value - see `attributes/defs.mjs`'s `contextMarker()`.
                line: {
                    stroke: '#78909C',
                    class: 'md-link'
                }
            },
            defaultLabel: {
                size: { width: 80, height: 20 },
                attrs: {
                    text: {
                        class: 'md-chip-text'
                    },
                    rect: {
                        ref: null,
                        x: 'calc(x - calc(w / 2))',
                        y: 'calc(y - calc(h / 2))',
                        width: 'calc(w)',
                        height: 'calc(h)',
                        rx: 'calc(h / 2)',
                        ry: 'calc(h / 2)',
                        class: 'md-chip-bg'
                    }
                }
            }
        }, super.defaults);
    }
}
