import { dia, shapes, util } from '@joint/core';

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

// `@joint/layout-elk` reads a port label's `size` directly rather than measuring the
// rendered text itself, so it has to be estimated from the label text up front.
// `Service` (below) computes and assigns it for every port as soon as the port is
// added, from that port's own label text length. The estimate only needs to roughly
// match `.md-port-label`'s CSS font size/weight, since it never has to be exact.
const PORT_LABEL_FONT_SIZE = 11;
const PORT_LABEL_AVERAGE_CHAR_WIDTH = PORT_LABEL_FONT_SIZE * 0.6;
const PORT_LABEL_HEIGHT = PORT_LABEL_FONT_SIZE + 5;

function estimatePortLabelSize(text: string): dia.Size {
    return {
        width: Math.ceil(text.length * PORT_LABEL_AVERAGE_CHAR_WIDTH),
        height: PORT_LABEL_HEIGHT
    };
}

// Square ports (rather than `PORT_ATTRS`' circles) set `HubService` apart as
// a hub with several ports fanning in/out on the same side.
const HUB_PORT_SIZE = { width: 14, height: 8 };
const HUB_PORT_MARKUP = [{
    tagName: 'rect',
    selector: 'rect'
}];
const HUB_PORT_ATTRS = {
    rect: {
        x: -HUB_PORT_SIZE.width / 2,
        y: -HUB_PORT_SIZE.height / 2,
        width: HUB_PORT_SIZE.width,
        height: HUB_PORT_SIZE.height,
        class: 'md-port'
    },
    text: {
        class: 'md-port-label'
    }
};

const CONTAINER_PADDING = '[top=40,left=20,bottom=20,right=20]';

/**
 * A tonal container surface - its final size and position are computed by ELK to fit
 * whatever gets embedded into it. Its label sits in the top-left corner, out of the
 * way of embedded elements.
 */
export class Container extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Container',
            size: { width: 100, height: 100 },
            padding: CONTAINER_PADDING,
            attrs: {
                body: {
                    class: 'md-container'
                },
                label: {
                    x: 12,
                    y: 10,
                    textAnchor: 'start',
                    textVerticalAnchor: 'top',
                    class: 'md-container-label'
                }
            }
        }, super.defaults);
    }
}

/**
 * A service node with exactly one 'in' (left) and one 'out' (right) port,
 * always - only the label `text` is left for each instance to fill in. See
 * `HubService` for a service with a custom number of ports.
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
                    in: {
                        position: {
                            name: 'absolute'
                        },
                        label: {
                            position: {
                                name: 'manual'
                            }
                        },
                        size: PORT_SIZE,
                        attrs: PORT_ATTRS,
                    },
                    out: {
                        position: {
                            name: 'absolute'
                        },
                        label: {
                            position: {
                                name: 'manual'
                            }
                        },
                        size: PORT_SIZE,
                        attrs: PORT_ATTRS,
                    }
                },
                items: [
                    { id: 'in', group: 'in', attrs: { text: { text: 'in' } } },
                    { id: 'out', group: 'out', attrs: { text: { text: 'out' } } }
                ]
            }
        }, super.defaults);
    }

    initialize(...args: any[]) {
        super.initialize(...args);

        // Ports present from the start don't go through `ports:add` (it only fires for
        // ports added after the element already exists), so size them here too.
        this._sizePortLabels(this.getPorts());
        this.on('ports:add', (_element: this, addedPorts: dia.Element.Port[]) => {
            this._sizePortLabels(addedPorts);
        });
    }

    private _sizePortLabels(ports: dia.Element.Port[]) {
        ports.forEach((port) => {
            const text = port.attrs?.text?.text;
            if (!port.id || typeof text !== 'string') return;
            this.portProp(port.id, 'label/size', estimatePortLabelSize(text));
        });
    }
}

/**
 * A service with a custom (per-instance) number of ports - `ports.items`
 * always comes from the instance, replacing `Service`'s fixed pair. Its own
 * `md-card--hub` outline (an emphasis color, not a shape change) sets it apart
 * as a hub with several ports fanning in/out on the same side.
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
                    class: 'md-card md-card--hub'
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
 * A link with a labelled, pill-shaped Material "assist chip" background - only
 * the label `text` is left for each instance to fill in.
 */
export class InteractionLink extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'example.InteractionLink',
            attrs: {
                // A CSS class alone can't color this: the arrowhead is a separate
                // `<marker>` def (in `<defs>`, so it isn't reached by a class on the
                // line) whose own color JointJS derives from this `stroke` value -
                // see `attributes/defs.mjs`'s `contextMarker()`.
                line: {
                    stroke: '#78909C',
                    class: 'md-link'
                }
            },
            defaultLabel: {
                size: { width: 80, height: 20 },
                inline: true,
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
                },
                position: 0.5
            }
        }, super.defaults);
    }
}
