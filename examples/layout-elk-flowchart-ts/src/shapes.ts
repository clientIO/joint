import { dia, shapes, util } from '@joint/core';

const PORT_ATTRS = {
    circle: {
        r: 6,
        class: 'port',
        // Without this, a port is just a circle - not a magnet `index.ts`'s
        // `element:magnet:pointerclick` (or JointJS's own link-dragging) can ever
        // hit-test against (see `Paper#pointerdown`'s `target.closest('[magnet]')`).
        magnet: true
    }
};

/**
 * Shared by `Process` and `Decision` - a top 'in' port group and a bottom 'out'
 * port group (ELK positions both, see `index.ts`'s `exportPort`), plus
 * `addInPort()`/`addOutPort()`, used by the two "+" buttons (`index.ts`) to
 * grow a node an extra port interactively, without needing a distinct
 * "decision" type - any node can end up with more than one incoming or
 * outgoing path.
 */
export class FlowchartNode extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            size: { width: 160, height: 70 },
            // No fixed `z` here - `index.ts` derives it from this element's `order`
            // (the model-order ELK respects, see `reorderAmongSiblings`), always
            // keeping it above `FlowLink`'s own fixed `z: 1` so a port stays clickable (see
            // `element:magnet:pointerclick`) even where a link already connects to
            // it, which paint order would otherwise put on top of it.
            ports: {
                groups: {
                    in: {
                        position: { name: 'top' },
                        attrs: PORT_ATTRS,
                        markup: [{ tagName: 'circle', selector: 'circle' }]
                    },
                    out: {
                        position: { name: 'bottom' },
                        attrs: PORT_ATTRS,
                        markup: [{ tagName: 'circle', selector: 'circle' }]
                    }
                }
            }
        }, super.defaults);
    }

    addInPort(): string {
        const portId = `${this.generatePortId()}`;
        this.addPort({ id: portId, group: 'in' });
        return portId;
    }

    addOutPort(): string {
        const portId = `${this.generatePortId()}`;
        this.addPort({ id: portId, group: 'out' });
        return portId;
    }
}

/**
 * A step - a plain rectangle. Starts with one 'in' and one 'out' port, but
 * `addInPort()`/`addOutPort()` (see `FlowchartNode`) let it grow extra ports,
 * the same as `Decision` - the shape is just a visual hint, not a structural
 * limit.
 */
export class Process extends FlowchartNode {
    defaults() {
        return util.defaultsDeep({
            type: 'flowchart.Process',
            attrs: {
                body: { class: 'node node--process' },
                label: { class: 'node-label' }
            },
            ports: {
                items: [
                    { group: 'in' },
                    { group: 'out' }
                ]
            }
        }, super.defaults());
    }
}

/**
 * A decision - a diamond, custom-drawn since `standard.Rectangle`'s markup has
 * no such shape. Starts with two 'out' ports (its two usual branches), but
 * inherits `addInPort()`/`addOutPort()` too, for extra ones.
 */
export class Decision extends FlowchartNode {
    preinitialize() {
        this.markup = [
            { tagName: 'path', selector: 'body' },
            { tagName: 'text', selector: 'label' }
        ];
    }

    defaults() {
        return util.defaultsDeep({
            type: 'flowchart.Decision',
            size: { width: 172, height: 104 },
            attrs: {
                body: {
                    class: 'node node--decision',
                    d: 'M calc(0.5*w) 0 L calc(w) calc(0.5*h) L calc(0.5*w) calc(h) L 0 calc(0.5*h) z'
                },
                label: { class: 'node-label' }
            },
            ports: {
                items: [
                    { group: 'in' },
                    { group: 'out' },
                    { group: 'out' }
                ]
            }
        }, super.defaults());
    }
}

/**
 * Start/end - a pill (its own class sets `rx`/`ry` to a `calc(h/2)` CSS value,
 * see `styles.scss`). One port only, 'in' for an end, 'out' for a start -
 * `example.ts` picks which by only ever adding one `ports.items` entry.
 */
export class Terminal extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'flowchart.Terminal',
            size: { width: 125, height: 46 },
            // See `FlowchartNode`'s own comment on `z` - derived from `order`, same reason.
            attrs: {
                body: { class: 'node node--terminal' },
                label: { class: 'node-label node-label--on-primary' }
            },
            ports: {
                groups: {
                    in: {
                        position: { name: 'top' },
                        attrs: PORT_ATTRS,
                        markup: [{ tagName: 'circle', selector: 'circle' }]
                    },
                    out: {
                        position: { name: 'bottom' },
                        attrs: PORT_ATTRS,
                        markup: [{ tagName: 'circle', selector: 'circle' }]
                    }
                }
            }
        }, super.defaults);
    }
}

/**
 * A flow edge - a plain arrow, with an optional label for a branch's condition
 * (e.g. "Yes"/"No") when its source has more than one outgoing path.
 */
export class FlowLink extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'flowchart.FlowLink',
            // Fixed, and lower than every node's - so a link never paints over (and
            // steals the click from) the port it connects to.
            z: 1,
            attrs: {
                line: {
                    class: 'link',
                    stroke: '#78909C'
                }
            },
            defaultLabel: {
                size: { width: 60, height: 18 },
                attrs: {
                    text: { class: 'link-label-text' },
                    rect: {
                        ref: null,
                        x: 'calc(x - calc(w / 2))',
                        y: 'calc(y - calc(h / 2))',
                        width: 'calc(w)',
                        height: 'calc(h)',
                        class: 'link-label-bg'
                    }
                },
                position: 0.5
            }
        }, super.defaults);
    }
}
