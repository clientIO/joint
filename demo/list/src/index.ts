import { dia, shapes, g, linkTools, util } from 'jointjs';

const GRID_SIZE = 8;
const PADDING_S = GRID_SIZE;
const PADDING_L = GRID_SIZE * 2;
const FONT_FAMILY = 'sans-serif';
const LIGHT_COLOR = '#FFF';
const DARK_COLOR = '#333';
const SECONDARY_DARK_COLOR = '#999';
const ACTION_COLOR = '#0057FF';
const LINE_WIDTH = 2;

const HEADER_ICON_SIZE = 50;
const HEADER_HEIGHT = 80;

const LIST_MAX_PORT_COUNT = 100;
const LIST_GROUP_NAME = 'list';
const LIST_ITEM_HEIGHT = 28;
const LIST_ITEM_WIDTH = GRID_SIZE * 40;
const LIST_ITEM_LABEL = 'List Item';
const LIST_ITEM_GAP = 1;
const LIST_BUTTON_RADIUS = 16;
const LIST_ADD_BUTTON_SIZE = 20;
const LIST_REMOVE_BUTTON_SIZE = 16;
const LIST_IMAGE_SIZE = 20;

const itemPosition = (portsArgs: dia.Element.Port[], elBBox: dia.BBox): g.Point[] => {
    return portsArgs.map((_port: dia.Element.Port, index: number, { length }) => {
        const bottom = elBBox.height - (LIST_ITEM_HEIGHT + LIST_ADD_BUTTON_SIZE) / 2 - PADDING_S;
        const y = (length - 1 - index) * (LIST_ITEM_HEIGHT + LIST_ITEM_GAP);
        return new g.Point(0, bottom - y);
    });
};

const itemAttributes = {
    attrs: {
        portBody: {
            magnet: 'active',
            width: 'calc(w)',
            height: 'calc(h)',
            x: '0',
            y: 'calc(-0.5*h)',
            fill: DARK_COLOR
        },
        portRemoveButton: {
            cursor: 'pointer',
            event: 'element:port:remove',
            transform: `translate(${PADDING_L},0)`,
            title: 'Remove List Item'
        },
        portRemoveButtonBody: {
            width: LIST_REMOVE_BUTTON_SIZE,
            height: LIST_REMOVE_BUTTON_SIZE,
            x: -LIST_REMOVE_BUTTON_SIZE / 2,
            y: -LIST_REMOVE_BUTTON_SIZE / 2,
            fill: LIGHT_COLOR,
            rx: LIST_BUTTON_RADIUS,
            ry: LIST_BUTTON_RADIUS
        },
        portRemoveButtonIcon: {
            d: 'M -4 -4 4 4 M -4 4 4 -4',
            stroke: DARK_COLOR,
            strokeWidth: LINE_WIDTH
        },
        portImage: {
            x: PADDING_L + LIST_REMOVE_BUTTON_SIZE,
            y: -LIST_IMAGE_SIZE / 2,
            width: LIST_IMAGE_SIZE,
            height: LIST_IMAGE_SIZE,
            xlinkHref: 'https://via.placeholder.com/20/FFA800'

        },
        portLabel: {
            pointerEvents: 'none',
            fontFamily: FONT_FAMILY,
            fontWeight: 400,
            fontSize: 13,
            fill: LIGHT_COLOR,
            textAnchor: 'start',
            textVerticalAnchor: 'middle',
            textWrap: {
                width: - LIST_REMOVE_BUTTON_SIZE - PADDING_L - 2 * PADDING_S - LIST_IMAGE_SIZE,
                maxLineCount: 1,
                ellipsis: true
            },
            x: PADDING_L + LIST_REMOVE_BUTTON_SIZE + LIST_IMAGE_SIZE + PADDING_S
        },

    },
    size: {
        width: LIST_ITEM_WIDTH,
        height: LIST_ITEM_HEIGHT
    },
    markup: [{
        tagName: 'rect',
        selector: 'portBody'
    }, {
        tagName: 'image',
        selector: 'portImage'
    }, {
        tagName: 'text',
        selector: 'portLabel',
    }, {
        tagName: 'g',
        selector: 'portRemoveButton',
        children: [{
            tagName: 'rect',
            selector: 'portRemoveButtonBody'
        }, {
            tagName: 'path',
            selector: 'portRemoveButtonIcon'
        }]
    }]
};

const headerAttributes = {
    attrs: {
        root: {
            magnet: false
        },
        body: {
            width: 'calc(w)',
            height: 'calc(h)',
            fill: LIGHT_COLOR,
            strokeWidth: LINE_WIDTH / 2,
            stroke: SECONDARY_DARK_COLOR,
            rx: 3,
            ry: 3,
        },
        icon: {
            width: HEADER_ICON_SIZE,
            height: HEADER_ICON_SIZE,
            x: PADDING_L,
            y: (HEADER_HEIGHT - HEADER_ICON_SIZE) / 2,
            xlinkHref: 'https://via.placeholder.com/30/0057FF'
        },
        label: {
            transform: `translate(${PADDING_L + HEADER_ICON_SIZE + PADDING_L},${PADDING_L})`,
            fontFamily: FONT_FAMILY,
            fontWeight: 600,
            fontSize: 16,
            fill: DARK_COLOR,
            text: 'Label',
            textWrap: {
                width: - PADDING_L - HEADER_ICON_SIZE - PADDING_L - PADDING_L,
                maxLineCount: 1,
                ellipsis: true
            },
            textVerticalAnchor: 'top',
        },
        description: {
            transform: `translate(${PADDING_L + HEADER_ICON_SIZE + PADDING_L},${PADDING_L + 20})`,
            fontFamily: FONT_FAMILY,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: 13,
            fill: SECONDARY_DARK_COLOR,
            textVerticalAnchor: 'top',
            text: 'Description',
            textWrap: {
                width: - PADDING_L - HEADER_ICON_SIZE - PADDING_L - PADDING_L,
                maxLineCount: 2,
                ellipsis: true
            }
        },
        portAddButton: {
            title: 'Add List Item',
            cursor: 'pointer',
            event: 'element:port:add',
            transform: `translate(calc(w-${3 * PADDING_S}),calc(h))`
        },
        portAddButtonBody: {
            width: LIST_ADD_BUTTON_SIZE,
            height: LIST_ADD_BUTTON_SIZE,
            rx: LIST_BUTTON_RADIUS,
            ry: LIST_BUTTON_RADIUS,
            x: -LIST_ADD_BUTTON_SIZE / 2,
            y: -LIST_ADD_BUTTON_SIZE / 2,
        },
        portAddButtonIcon: {
            d: 'M -4 0 4 0 M 0 -4 0 4',
            stroke: LIGHT_COLOR,
            strokeWidth: LINE_WIDTH
        }
    },
    markup: [{
        tagName: 'rect',
        selector: 'body',
    }, {
        tagName: 'text',
        selector: 'label',
    }, {
        tagName: 'text',
        selector: 'description',
    }, {
        tagName: 'image',
        selector: 'icon',
    }, {
        tagName: 'g',
        selector: 'portAddButton',
        children: [{
            tagName: 'rect',
            selector: 'portAddButtonBody'
        }, {
            tagName: 'path',
            selector: 'portAddButtonIcon'
        }]
    }]
};

class ListElement extends dia.Element {

    defaults() {
        return {
            ...super.defaults,
            ...headerAttributes,
            type: 'ListElement',
            size: { width: LIST_ITEM_WIDTH },
            ports: {
                groups: {
                    [LIST_GROUP_NAME]: {
                        position: itemPosition,
                        ...itemAttributes
                    }
                },
                items: []
            }
        }
    }

    initialize(...args: any[]) {
        this.on('change:ports', () => this.resizeToFitPorts());
        this.resizeToFitPorts();
        this.toggleAddPortButton(LIST_GROUP_NAME);
        super.initialize.call(this, ...args);
    }

    resizeToFitPorts() {
        const { length } = this.getPorts();
        this.prop(['size', 'height'], HEADER_HEIGHT + (LIST_ITEM_HEIGHT + LIST_ITEM_GAP) * length + PADDING_L);
    }

    addDefaultPort() {
        if (!this.canAddPort(LIST_GROUP_NAME)) return;
        this.addPort({
            group: LIST_GROUP_NAME,
            attrs: { portLabel: { text: this.getDefaultPortName() }}
        });
    }

    getDefaultPortName() {
        const ports = this.getGroupPorts(LIST_GROUP_NAME);
        let portName;
        let i = 1;
        do {
            portName = `${LIST_ITEM_LABEL} ${i++}`;
        } while (ports.find(port => port.attrs.portLabel.text === portName));
        return portName;
    }

    canAddPort(group: string): boolean {
        return Object.keys(this.getGroupPorts(group)).length < LIST_MAX_PORT_COUNT;
    }

    toggleAddPortButton(group: string): void {
        const buttonAttributes = this.canAddPort(group)
            ? { fill: ACTION_COLOR, cursor: 'pointer' }
            : { fill: '#BEBEBE', cursor: 'not-allowed' };
        this.attr(['portAddButton'], buttonAttributes, {
            isolate: true
        });
    }
}

class ListLink extends shapes.standard.DoubleLink {

    defaults() {
        return util.defaultsDeep({
            type: 'ListLink',
            z: -1,
            attrs: {
                line: {
                    stroke: LIGHT_COLOR,
                    targetMarker: {
                        stroke: SECONDARY_DARK_COLOR
                    }
                },
                outline: {
                    stroke: SECONDARY_DARK_COLOR
                }
            }
        }, super.defaults);
    }
}

const shapeNamespace = {
    ...shapes,
    ListElement,
    ListLink
}

const graph = new dia.Graph({}, { cellNamespace: shapeNamespace });

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 800,
    gridSize: GRID_SIZE,
    model: graph,
    frozen: true,
    async: true,
    defaultLink: () => new ListLink(),
    sorting: dia.Paper.sorting.APPROX,
    magnetThreshold: 'onleave',
    linkPinning: false,
    snapLinks: true,
    background: {
        color: '#F3F7F6'
    },
    defaultRouter: { name: 'manhattan', args: { step: GRID_SIZE }},
    cellViewNamespace: shapeNamespace,
    validateConnection: (sourceView, _sourceMagnet, targetView, _targetMagnet) => {
        if (sourceView === targetView) return false;
        return true;
    }
});

paper.el.style.border = `1px solid #e2e2e2`;

// Events

function onPaperElementPortAdd(elementView: dia.ElementView, evt: dia.Event): void {
    evt.stopPropagation();
    const message = elementView.model as ListElement;
    message.addDefaultPort();
}

function onPaperElementPortRemove(elementView: dia.ElementView, evt: dia.Event): void {
    evt.stopPropagation();
    const portId = elementView.findAttribute('port', evt.target);
    const message = elementView.model as ListElement
    message.removePort(portId);
}

function onPaperLinkMouseEnter(linkView: dia.LinkView) {
    const toolsView = new dia.ToolsView({
        tools: [new linkTools.Remove()]
    });
    linkView.addTools(toolsView);
}

function onPaperLinkMouseLeave(linkView: dia.LinkView) {
    linkView.removeTools();
}

paper.on({
    'element:port:remove': onPaperElementPortRemove,
    'element:port:add': onPaperElementPortAdd,
    'link:mouseenter': onPaperLinkMouseEnter,
    'link:mouseleave': onPaperLinkMouseLeave
});

// Example Diagram

const list1 = new ListElement({
    attrs: {
        label: {
            text: 'List of Items 1'
        },
        description: {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus quis gravida sem, vitae mollis lectus. Vivamus in justo sit amet turpis auctor facilisis eget vitae magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ut varius tortor. Donec volutpat pharetra augue, sed tincidunt nibh tempus eu. Nulla facilisi. Quisque pharetra, elit porta laoreet faucibus, justo dui ullamcorper massa, vitae sollicitudin metus nunc vel leo. Curabitur sit amet mattis tortor. Morbi eleifend viverra suscipit. Maecenas fringilla, nibh vitae elementum rutrum, ipsum ipsum volutpat nisi, eu euismod arcu justo sit amet dolor. Nam pulvinar ligula varius purus vestibulum tincidunt.'
        }
    }
});
list1.position(50, 100);
list1.addDefaultPort();
list1.addDefaultPort();

const list2 = list1.clone() as ListElement;
list2.attr(['label', 'text'], 'List Of Items 2');
list2.position(550, 400);

graph.resetCells([list1, list2]);

paper.unfreeze();
