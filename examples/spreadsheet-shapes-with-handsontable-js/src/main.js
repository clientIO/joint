import {
    dia,
    shapes,
    highlighters,
    util,
    linkTools,
} from '@joint/core';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.min.css';
import './styles.scss';

const HotModel = dia.Element.define('HotModel', {
    size: {
        width: 300,
        height: 0
    },
    z: 1,
    data: null,
    ports: {
        groups: {
            top: {
                z: 0,
                position: {
                    name: 'line',
                    args: {
                        start: {
                            x: 50,
                            y: -15
                        },
                        end: {
                            x: 'calc(w)',
                            y: -15
                        }
                    }
                },
                markup: util.svg/*xml*/`
                      <line @selector="portLine" x1="0" y1="0" x2="0" y2="30" stroke="#131e29" stroke-width="2"/>
                      <rect @selector="portBody" magnet="true" x="-5" y="-5" width="10" height="10" stroke="#131e29" stroke-width="2" fill="white" cursor="crosshair"/>
                `
            }
        }
    }
});

const HotFlags = {
    // RenderView is used to render the adaptive card inside the foreign object
    RenderView: '@render-view',
    // UpdateView is used to update the size of the foreign object
    // and the color of border
    UpdateView: '@update-view',
    // TransformView is used to position and rotate the view
    TransformView: '@transform-view',
    // MeasureView is used to measure the view and update
    // the size of the model
    MeasureView: '@measure-view'
};

const HotModelView = dia.ElementView.extend({

    // The root of the element view is the <g> element by default.
    tagName: 'g',

    HEADER_HEIGHT: 30,
    COL_WIDTH: 50,

    // Whenever the model attributes change (the map key is the attribute name),
    // the update() method will be called, which will contain all the flags that were reported.
    presentationAttributes: {
        size: [HotFlags.UpdateView],
        position: [HotFlags.TransformView],
        angle: [HotFlags.TransformView],
        label: [HotFlags.RenderView],
    },

    // The initFlag property is a list of flags that will be reported to the paper
    // when the element view is initialized.
    initFlag: [HotFlags.RenderView, HotFlags.UpdateView, HotFlags.TransformView, HotFlags.MeasureView],

    confirmUpdate: function (flags) {
        if (this.hasFlag(flags, HotFlags.RenderView)) this.render();
        if (this.hasFlag(flags, HotFlags.UpdateView)) this.update();
        // `updateTransformation` is the original method of the `dia.ElementView`
        // it applies the `transform` attribute to the root element i.e. the `<foreignObject>`
        if (this.hasFlag(flags, HotFlags.TransformView)) this.updateTransformation();
        if (this.hasFlag(flags, HotFlags.MeasureView)) this.resizeModel();
    },

    init: function () {
        this.el.setAttribute('magnet', 'false');
        // Create a ResizeObserver to measure the card's size
        this.resizeObserver = new ResizeObserver(() => this.requestMeasurement());
    },

    onRemove() {
        this.releaseResources();
    },

    releaseResources() {
        const {
            hot,
            resizeObserver
        } = this;
        if (!hot) return;
        hot.destroy();
        resizeObserver.disconnect();
        this.hot = null;
        this.selectors = null;
    },

    render: function () {
        const {
            resizeObserver,
            HEADER_HEIGHT
        } = this;

        this.releaseResources();
        const markup = util.svg/*xml*/`
            <rect @selector="header" height="${HEADER_HEIGHT}" fill="#F0F0F0" cursor="move" stroke="#DEDEDE"/>
            <rect @selector="border" height="3" fill="#131e239" stroke-width="1"/>
            <text @selector="label"
                y="${HEADER_HEIGHT / 2}"
                fill="#131e29"
                dominant-baseline="central"
                text-anchor="middle"
                font-size="14"
                font-family="sans-serif"
                font-weight="bold"
            />
            <foreignObject @selector="fo" y="${HEADER_HEIGHT}">
                <div xmlns="http://www.w3.org/1999/xhtml" @selector="container"></div>
            </foreignObject>
        `;

        const view = this;
        const docs = this.parseDOMJSON(markup);
        this.selectors = docs.selectors;
        this.el.appendChild(docs.fragment);

        const hot = new Handsontable(this.selectors.container, {
            data: this.model.get('data'),
            cells: (row, col) => {
                return {
                    readOnly: row === 0,
                    className: row === 0 ? 'table-header' : ''
                };
            },
            colHeaders: true,
            rowHeaders: true,
            height: 'auto',
            selectionMode: 'multiple',
            licenseKey: 'non-commercial-and-evaluation', // for non-commercial use only
            contextMenu: {
                items: {
                    row_below: {
                        name: 'Add row'
                    },
                    remove_row: {
                        disabled() {
                            if (this.getSelectedLast()[0] < 1) return true;
                            return this.countRows() < 2;
                        }
                    },
                    sp1: '---------',
                    calculate: {
                        name: 'Calculate column',
                        disabled() {
                            const [row, col] = this.getSelectedLast();
                            return row !== -1 || col === 0;
                        },
                        callback() {
                            const col = this.getSelectedLast()[1];
                            const data = this.getDataAtCol(col);
                            data.forEach((value, index) => {
                                calcValue(view, index, col, value);
                            });
                        }
                    },
                }
            }
        });

        // Keep a reference to the AdaptiveCard instance
        this.hot = hot;

        this.addHooks();
        this.addEventListeners();

        // Observe the table's size changes
        resizeObserver.observe(hot.rootElement);

        this._renderPorts();
    },

    addHooks: function () {

        const {
            hot
        } = this;
        if (!hot) return;

        hot.addHook('afterChange', (changes, type) => {
            this.notify('element:change', changes, type);
            this.requestMeasurement();
        });

        hot.addHook('beforeOnCellMouseDown', (event, coords, element) => {
            this.constructor.activeView = this;
        });

        hot.addHook('afterSelection', () => {
            if (this.constructor.activeView !== this) {
                return;
            }
            const selection = [];
            this.hot.getSelectedRange().forEach((range) => {
                const [min, max] = [range.from.col, range.to.col].sort();
                for (let i = Math.max(0, min); i <= max; i++) {
                    selection.push(`col-${i}`);
                }
            });

            this.notify('element:columns:selection', util.uniq(selection).sort());
        });

        hot.addHook('afterDeselect', () => {
            if (this.constructor.activeView !== this) return;
            this.notify('element:columns:selection', []);
        });
    },

    addEventListeners: function () {
        this.listenTo(paper, 'element:columns:selection', (elementView, selection) => {
            if (elementView === this) return;
            this.hot.deselectCell();
        });
    },

    requestMeasurement(opt = {}) {
        this.requestUpdate(this.getFlag(HotFlags.MeasureView), opt);
    },

    resizeModel() {
        const {
            model,
            hot,
            HEADER_HEIGHT,
            COL_WIDTH,
        } = this;
        if (!hot) return;

        const {
            width,
            height
        } = model.size();

        // add +1 because the foreign object is shifted by 1px
        const hotHeight = hot.rootElement.offsetHeight + HEADER_HEIGHT + 1;
        const countCols = hot.countCols();
        // add +1 to prevent the horizontal scrollbar to appear
        let hotWidth = 1;
        for (let i = 0; i <= countCols; i++) {
            hotWidth += hot.getColWidth(i);
        }

        if (height === hotHeight && width === hotWidth) return;

        model.resize(hotWidth, hotHeight, {
            view: this.cid
        });

        const ports = [];
        let x = COL_WIDTH;
        for (let i = 0; i < countCols; i++) {
            const colWidth = hot.getColWidth(i);
            ports.push({
                id: `col-${i}`,
                group: 'top',
                args: {
                    x: x + colWidth / 2,
                }
            });
            x += colWidth;
        }
        model.prop('ports/items', ports, {
            rewrite: true,
            view: this.cid
        });
        this._renderPorts();
        this.update();
        // We have resized the container for `handsontable`, removing
        // any scrollbars that might have been there. We need to
        // update the table to reflect the new size.
        this.hot.view.adjustElementsSize();
    },

    update: function () {
        const {
            selectors,
            model,
            HEADER_HEIGHT
        } = this;
        const {
            width,
            height
        } = model.size();
        selectors.fo.setAttribute('width', width);
        selectors.header.setAttribute('width', width);
        selectors.border.setAttribute('width', width);
        selectors.fo.setAttribute('height', height - HEADER_HEIGHT);
        selectors.label.setAttribute('x', width / 2);
        selectors.label.textContent = model.get('label') || '';
        // Clean the cache of the nodes that are used to render the card
        // (the cache contains the position and size of the nodes that could
        // have been changed during the resize of the card).
        this.cleanNodesCache();
    }
}, {
    activeView: null
});

const Link = shapes.standard.Link.define('Link', {
    attrs: {
        wrapper: {
            cursor: 'default',
        },
        line: {
            stroke: '#131e29'
        }
    }
}, {
    defaultLabel: {
        attrs: {
            label: {
                fill: '#131e29',
                fontSize: 14,
                fontFamily: 'sans-serif',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                pointerEvents: 'none'
            },
            bg: {
                fill: '#ffffff',
                stroke: '#131e29',
                strokeWidth: 1,
                ref: 'label',
                x: 'calc(x - 6)',
                y: 'calc(y - 6)',
                width: 'calc(w + 12)',
                height: 'calc(h + 12)',
                cursor: 'pointer'
            }
        },
        markup: util.svg/*xml*/`
            <rect @selector="bg"/>
            <text @selector="label"/>
        `
    }
});

const operationsMap = {
    'add-one': {
        fn: (x) => Number(x) + 1,
        label: 'y = x + 1',
    },
    'multiply-by-two': {
        fn: (x) => Number(x) * 2,
        label: 'y = 2x'
    },
    identity: {
        fn: (x) => x,
        label: 'y = x'
    },
    'add-unit': {
        fn: (x) => String(x) + 'px',
        label: 'y = concat(x, "px")'
    },
};

const operations = Object.keys(operationsMap);

const namespace = {
    ...shapes,
    Link,
    HotModel,
    HotModelView
};

const graph = new dia.Graph({}, {
    cellNamespace: namespace
});
const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: '100%',
    height: '100%',
    model: graph,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    cellViewNamespace: namespace,
    overflow: true,
    interactive: {
        linkMove: false
    },
    linkPinning: false,
    snapLinks: true,
    snapLabels: true,
    labelsLayer: true,
    defaultAnchor: {
        name: 'modelCenter',
        args: {
            dy: -5
        }
    },
    defaultConnectionPoint: {
        name: 'anchor',
    },
    defaultConnector: {
        name: 'curve',
        args: {
            sourceDirection: 'up',
            targetDirection: 'up',
        }
    },
    preventDefaultViewAction: false,
    background: {
        color: '#FEFEEB'
    },
    defaultLink: () => {
        const link = new Link({ z: -1 });
        setOperation(link, 'identity');
        return link;
    },
    validateConnection: (cellViewS, magnetS, cellViewT, magnetT, end, linkView) => {
        if (cellViewS === cellViewT) return false;
        if (cellViewS.model.isLink() || cellViewT.model.isLink()) return false;
        return true;
    }
});

// Content of the graph

const hot1 = new HotModel({
    id: 'hot1',
    label: 'Table 1',
    position: {
        x: 50,
        y: 250
    },
    size: {
        width: 300,
        height: 300
    },
    data: [
        ['---', 'Alpha', 'Beta', 'Gamma', 'Delta'],
        ['2021', 30, 13, 12, 13],
        ['2022', 30, 15, 12, 11],
        ['2023', 30, 17, 12, 14],
        ['2023', 30],
    ],
});

const hot2 = new HotModel({
    id: 'hot2',
    label: 'Table 2',
    position: {
        x: 450,
        y: 250
    },
    size: {
        width: 300,
        height: 300
    },
    data: [
        ['---', 'Alpha', 'Beta', 'Gamma', 'Delta'],
        ['2021', 22, 11, 13, 5],
        ['2022', 30, 15, 12, 6],
        ['2023', 60, 12, 11, 7],
        ['2024'],
    ],
});

const link1 = new Link({
    source: {
        id: hot1.id,
        port: 'col-1'
    },
    target: {
        id: hot2.id,
        port: 'col-3'
    }
});

const link2 = new Link({
    source: {
        id: hot1.id,
        port: 'col-2'
    },
    target: {
        id: hot2.id,
        port: 'col-2'
    }
});

const link3 = new Link({
    source: {
        id: hot2.id,
        port: 'col-1'
    },
    target: {
        id: hot1.id,
        port: 'col-3'
    }
});

setOperation(link1, 'add-one');
setOperation(link2, 'multiply-by-two');
setOperation(link3, 'identity');

graph.addCells([hot1, hot2, link1, link2, link3]);

// Event listeners

paper.on('element:pointerdown', (elementView, evt) => {
    if (elementView.selectors.fo.contains(evt.target)) {
        elementView.preventDefaultInteraction(evt);
    }
});

// Remove the highlighter the user starts dragging a port
paper.on('element:magnet:pointerdown', (elementView) => {
    highlighters.addClass.removeAll(paper);
});

// Change the operation when the label is clicked
paper.on('link:pointerclick', (linkView, evt) => {
    if (!evt.target.matches('.label *')) return;
    const link = linkView.model;
    const nextOperation = operations[(operations.indexOf(link.prop('operation')) + 1) % operations.length];
    setOperation(link, nextOperation);
});

// Show how the columns are mapped when the user selects them
paper.on('element:columns:selection', (elementView, selection) => {

    highlighters.addClass.removeAll(paper);

    const mappedColumns = getMappedColumns(elementView, selection);

    selection.forEach((colId) => {
        // Highlight source port
        highlighters.addClass.add(elementView, {
            port: colId,
            selector: 'portBody'
        }, `hgl-source-${colId}`);
    });

    Object.keys(mappedColumns).forEach((id) => {
        const targetView = paper.findViewByModel(id);
        if (targetView) {
            const selectionRanges = [];
            const rowCount = targetView.hot.countRows();
            mappedColumns[id].forEach(({ link, colId }) => {
                // Highlight link
                highlighters.addClass.add(link.findView(paper), {
                    selector: 'line'
                }, `hgl-link-${link.id}`);

                highlighters.addClass.add(link.findView(paper), {
                    label: 0
                }, `hgl-label-${link.id}`);

                // Highlight target port
                highlighters.addClass.add(targetView, {
                    port: colId,
                    selector: 'portBody'
                }, `hgl-target-${colId}`);
                // Calculate target selection ranges
                const [, index] = colId.split('-');
                const id = Number(index);
                selectionRanges.push([0, id, rowCount - 1, id]);
            });
            // It can not be selected synchronously
            // (it seems to be unselected later in this event loop)
            setTimeout(() => {
                targetView.hot.selectCells(selectionRanges, false, false);
            });
        }
    });
});

// Update the mapped table cells when the source table cells change
paper.on('element:change', function (elementView, changes, type) {
    changes.forEach(([row, col, , value]) => {
        calcValue(elementView, row, col, value);
    });
});

paper.on('link:mouseenter', (linkView) => {
    const toolsView = new dia.ToolsView({
        tools: [
            new linkTools.Remove({ distance: -25, scale: 1.2 }),
            new linkTools.Remove({ distance: 25, scale: 1.2 })
        ]
    });
    linkView.addTools(toolsView);
});

paper.on('link:mouseleave', (linkView) => {
    linkView.removeTools();
});

// Helper functions

function setOperation(link, operation) {
    const position = link.prop(['labels', 0, 'position']);
    link.set({
        operation,
        labels: [{
            attrs: {
                label: {
                    text: operationsMap[operation].label
                }
            },
            position
        }]
    });
}

function getMappedColumns(elementView, columns) {

    const outboundElements = {};
    const outboundLinks = graph.getConnectedLinks(elementView.model, { outbound: true });
    columns.forEach((colId) => {
        outboundLinks.filter((link) => link.prop('source/port') === colId).forEach((link) => {
            const target = link.getTargetElement();
            if (!target) return;
            if (!outboundElements[target.id]) {
                outboundElements[target.id] = [];
            }
            outboundElements[target.id].push({
                link,
                colId: link.prop('target/port')
            });
        });
    });
    return outboundElements;
}

function calcValue(elementView, row, col, value) {
    if (row === 0) return;
    const colId = `col-${col}`;
    const mappedColumns = getMappedColumns(elementView, [colId]);
    Object.keys(mappedColumns).forEach((id) => {
        const targetView = paper.findViewByModel(id);
        if (!targetView) return;
        mappedColumns[id].forEach(({ link, colId }) => {
            const operation = link.prop('operation');
            const fn = operationsMap[operation].fn;
            const [, index] = colId.split('-');
            const id = Number(index);
            targetView.hot.setDataAtCell(row, id, fn(value));
        });
    });
}
