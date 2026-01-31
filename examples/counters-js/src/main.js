import { dia, shapes, util, mvc } from '@joint/core';
import './styles.css';

// Config

// number of columns
const COLS = 10;
// number of rows
const ROWS = 10;
// number of miliseconds between state update
const STATE_UPDATE_MS = 10;
// number of miliseconds between data point update
const DATA_POINT_UPDATE_MS = 10;
// the height of the node header
const NODE_HEADER_HEIGHT = 30;
// the height of the node counter
const NODE_COUNTER_HEIGHT = 20;
// the padding around the counters
const NODE_COUNTER_PADDING = 10;
// the maximum number of node counters
const NODE_MAX_COUNTERS = 9;

// Paper

const paperContainer = document.getElementById("paper-container");

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: "100%",
    height: "100%",
    gridSize: 20,
    drawGrid: { name: "mesh" },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: "#F3F7F6" }
});

paperContainer.appendChild(paper.el);

enableVirtualRendering(paper);

paper.on("blank:pointerdown", function (evt) {
    evt.data = {
        clientX: evt.clientX,
        clientY: evt.clientY,
        scrollLeft: paperContainer.scrollLeft,
        scrollTop: paperContainer.scrollTop
    };
});

paper.on("blank:pointermove", function (evt) {
    const { clientX, clientY, data } = evt;
    paperContainer.scrollLeft = data.scrollLeft - (clientX - data.clientX);
    paperContainer.scrollTop = data.scrollTop - (clientY - data.clientY);
});

paper.on("node:button:pointerclick", function (nodeView) {
    const node = nodeView.model;
    node.toggle();
});

// Shape
class Node extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            size: { width: 200, height: 0 },
            z: 2,
            type: "Node",
            // Data
            uid: null,
            name: "",
            expanded: true,
            counterNames: [],
            counterValues: [],
            status: null
        };
    }

    initialize(...args) {
        super.initialize(...args);
        this.on("change", (_cell, opt) => this.onChange(opt));
        this.setSize();
    }

    onChange(opt) {
        const { changed } = this;
        if ("uid" in changed && !changed.uid) {
            this.set(
                {
                    counterNames: [],
                    counterValues: [],
                    status: null
                },
                opt
            );
        }
        if ("counterNames" in changed || "expanded" in changed) {
            this.setSize(opt);
        }
    }

    setSize(opt) {
        const { counterNames, size, expanded, uid } = this.attributes;
        let height = NODE_HEADER_HEIGHT;
        const numberOfRows = uid ? counterNames.length : 0;
        if (expanded)
            height += 2 * NODE_COUNTER_PADDING + numberOfRows * NODE_COUNTER_HEIGHT;
        opt.resized = size.height !== height;
        this.resize(size.width, height, opt);
    }

    changeNode(node) {
        this.startBatch("change-uid");
        this.set({
            name: node.name,
            uid: node.uid,
            counterNames: [],
            counterValues: [],
            status: null
        });
        this.stopBatch("change-uid");
    }

    toggle() {
        this.startBatch("change-expanded");
        this.set("expanded", !this.get("expanded"));
        this.stopBatch("change-expanded");
    }

    changeStatus(status) {
        const { status: currentStatus } = this.attributes;
        if (status === currentStatus) return;
        this.prop("status", status, { dry: true });
    }

    changeDataPoint(names, values) {
        const { counterValues } = this.attributes;
        for (let i = 0, n = values.length; i < n; i++) {
            if (counterValues[i] !== values[i]) break;
            return;
        }
        this.prop(
            {
                counterNames: names,
                counterValues: values
            },
            { dry: true }
        );
    }

    getCounterNames() {
        return this.get("counterNames");
    }

    toJSON() {
        const { id, type, position, uid, name, expanded } = this.attributes;
        return { id, type, position, uid, name, expanded };
    }
}

const Flags = {
    ...dia.ElementView.Flags,
    STATUS: "STATUS",
    LABEL: "LABEL",
    VALUES: "VALUES"
};

class NodeView extends dia.ElementView {
    vSeparator;
    vBody;
    vLabel;
    vButton;
    vCounterNames;
    vCounterValues;
    counterValuesCache;

    presentationAttributes() {
        return dia.ElementView.addPresentationAttributes({
            expanded: [Flags.RENDER],
            counterNames: [Flags.RENDER],
            counterValues: [Flags.VALUES],
            status: [Flags.STATUS],
            name: [Flags.LABEL]
        });
    }

    confirmUpdate(flag, opt) {
        let flags = dia.ElementView.prototype.confirmUpdate.call(this, flag, opt);
        if (this.hasFlag(flags, Flags.STATUS)) {
            this.toggleStatus();
            flags = this.removeFlag(flags, Flags.STATUS);
        }
        if (this.hasFlag(flags, Flags.LABEL)) {
            this.updateLabel();
            flags = this.removeFlag(flags, Flags.LABEL);
        }
        if (this.hasFlag(flags, Flags.VALUES)) {
            this.updateCounters();
            flags = this.removeFlag(flags, Flags.VALUES);
        }
        return flags;
    }

    render() {
        const { vel, model } = this;
        if (!vel) return this;

        this.cleanNodesCache();

        const body = (this.vBody = V("rect").addClass("node-body"));
        const label = (this.vLabel = V("text").addClass("node-label"));
        const button = (this.vButton = V("path").addClass("node-button"));

        vel.empty().append([body, label, button]);

        if (model.get("expanded")) {
            const counterGroup = this.renderCounterGroup();
            const separator = (this.vSeparator = V("path").addClass(
                "node-separator"
            ));
            vel.append([separator, counterGroup]);
        } else {
            this.vCounterNames = [];
            this.vCounterValues = [];
            this.vSeparator = null;
        }

        this.translate();
        this.update();

        return this;
    }

    renderCounterGroup() {
        const { model } = this;
        const { width } = model.size();
        const vCounterNames = (this.vCounterNames = []);
        const vCounterValues = (this.vCounterValues = []);
        const names = model.get("counterNames");
        for (let i = 0, n = names.length; i < n; i++) {
            const y =
                NODE_COUNTER_PADDING +
                i * NODE_COUNTER_HEIGHT +
                NODE_COUNTER_HEIGHT / 2;
            const vName = V("text")
                .attr({
                    transform: `translate(${NODE_COUNTER_PADDING}, ${y})`,
                    "font-size": 14,
                    "font-family": "sans-serif",
                    "text-anchor": "start"
                })
                .addClass("node-counter-name")
                .text(names[i], {
                    textVerticalAnchor: "middle"
                });
            const vValue = V("text")
                .attr({
                    transform: `translate(${width - NODE_COUNTER_PADDING}, ${y})`,
                    "font-size": 14,
                    "font-family": "sans-serif",
                    "text-anchor": "end"
                })
                .addClass("node-counter-value");

            vCounterNames.push(vName);
            vCounterValues.push(vValue);
        }
        return V("g")
            .attr({
                transform: `translate(0, ${NODE_HEADER_HEIGHT})`
            })
            .addClass("node-counters")
            .append([...vCounterNames, ...vCounterValues]);
    }

    update() {
        this.updateBody();
        this.updateSeparator();
        this.updateLabel();
        this.updateCounters();
        this.toggleStatus();
        this.updateButton();
    }

    updateButton() {
        const { vButton, model } = this;
        const { size, expanded } = model.attributes;
        vButton.attr({
            d: expanded ? "M -6 6 0 0 6 6" : "M -6 0 0 6 6 0",
            stroke: "#333",
            "stroke-width": 3,
            fill: "none",
            "pointer-events": "bounding-box",
            event: "node:button:pointerclick",
            cursor: "pointer",
            transform: `translate(${size.width - 20},${NODE_HEADER_HEIGHT / 2})`
        });
    }

    updateBody() {
        const { model, vBody } = this;
        const { width, height } = model.size();
        vBody.attr({
            width: width,
            height: height,
            stroke: "#333",
            rx: 5,
            ry: 5
        });
    }

    updateSeparator() {
        const { model, vSeparator } = this;
        if (!vSeparator) return;
        const { width } = model.size();
        vSeparator.attr({
            d: `M 0 ${NODE_HEADER_HEIGHT} h ${width}`,
            stroke: "#333",
            "stroke-width": "2"
        });
    }

    updateCounters() {
        const { model, vCounterValues } = this;
        const values = model.get("counterValues");
        const cache = this.counterValuesCache;
        this.counterValuesCache = [];
        for (let i = 0, n = vCounterValues.length; i < n; i++) {
            const formattedValue = this.formatValue(values[i]);
            if (cache && formattedValue === cache[i]) continue;
            this.counterValuesCache[i] = formattedValue;
            vCounterValues[i].text(formattedValue, {
                textVerticalAnchor: "middle"
            });
        }
    }

    formatValue(value) {
        if (typeof value !== "number") return "-";
        return value.toFixed(2);
    }

    updateLabel() {
        const { model, paper, vLabel } = this;
        if (!paper) return;
        const { width } = model.size();
        const text = model.get("name") || "";

        const fontAttributes = {
            "font-size": 16,
            "font-family": "sans-serif",
            "text-anchor": "middle",
            transform: `translate(${width / 2},${NODE_HEADER_HEIGHT / 2})`
        };

        const wrappedText = util.breakText(
            text,
            { width: width - 60 },
            fontAttributes,
            {
                svgDocument: paper.svg,
                ellipsis: true,
                maxLineCount: 1
            }
        );
        vLabel.attr(fontAttributes);
        vLabel.text(wrappedText, { textVerticalAnchor: "middle" });
    }

    toggleStatus() {
        let color;
        switch (this.model.prop("status")) {
            case null: {
                color = "#FFFFFF";
                break;
            }
            case "D": {
                color = "#78A75A";
                break;
            }
            case "A": {
                color = "#992B15";
                break;
            }
            default: {
                color = "#EAC452";
            }
        }
        this.vBody.attr("fill", color);
    }
}

Object.assign(shapes, {
    Node,
    NodeView
});

// Events

function getCellsFromUid(graph, uid) {
    const uidMap = graph.get("uidMap");
    if (!uidMap) return [];
    const ids = uidMap[uid];
    if (!ids) return [];
    return ids.reduce((acc, id) => {
        const node = graph.getCell(id);
        if (node) acc.push(node);
        return acc;
    }, []);
}

function generateCells(graph, c, r) {
    graph.set(
        "nodes",
        Array.from({ length: c * r }, (_, index) => {
            return { uid: `id-${index}`, name: `Data ${index + 1}` };
        })
    );

    const nodes = graph.get("nodes");
    const count = nodes.length;
    const cells = [];
    let lastEl = null;
    let k = 0;
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            if (count === k) k = 0;
            const node = nodes[k++];
            const { uid, name } = node;
            const el = new Node({
                id: `generated-${i}-${j}`,
                position: { x: j * 250, y: i * 260 },
                uid,
                name
            });
            cells.push(el);
            if (lastEl && j !== 0) {
                const link = new shapes.standard.Link({
                    source: { id: lastEl.id },
                    target: { id: el.id }
                });
                link.unset("labels");
                cells.push(link);
            }
            lastEl = el;
        }
    }
    graph.resetCells(cells);

    buildUidMap(graph);
}

function changeDataPoint(graph, dataPointEvent) {
    const { uid, name, ...counterPairs } = dataPointEvent;
    getCellsFromUid(graph, uid).forEach((node) => {
        let names = node.getCounterNames();
        if (names.length === 0) {
            names = Object.keys(counterPairs);
        }
        const values = names.map((name) => counterPairs[name]);
        getCellsFromUid(graph, uid).forEach((node) =>
            node.changeDataPoint(names, values)
        );
    });
}

function changeState(graph, stateEvent) {
    const { uid, messageClass } = stateEvent;
    getCellsFromUid(graph, uid).forEach((node) =>
        node.changeStatus(messageClass)
    );
}

function runEvents(
    graph,
    { stateInterval = 100, dataInterval = 100 } = {}
) {
    const id1 = setInterval(() => {
        const elements = graph.getElements();
        const element = elements[g.random(0, elements.length - 1)];
        if (!element) return;
        if (!element.get("uid")) return;

        changeState(graph, {
            uid: element.attributes.uid,
            name: element.get("name"),
            messageClass: ["A", "B", "C", "D"][g.random(0, 3)]
        });
    }, stateInterval);

    const id2 = setInterval(() => {
        const elements = graph.getElements();
        const element = elements[g.random(0, elements.length - 1)];
        if (!element) return;
        if (!element.get("uid")) return;

        let counterNames = element.get("counterNames");
        if (counterNames.length === 0) {
            // or generate a new ones
            counterNames = Array.from(
                { length: g.random(0, NODE_MAX_COUNTERS) },
                (_, i) => {
                    return `Counter ${i + 1}`;
                }
            );
        }

        const counterPairs = counterNames.reduce((acc, name) => {
            acc[name] = g.random(0, 100);
            return acc;
        }, {});

        changeDataPoint(graph, {
            uid: element.attributes.uid,
            name: element.get("name"),
            ...counterPairs
        });
    }, dataInterval);

    return () => {
        clearInterval(id1);
        clearInterval(id2);
    };
}

function buildUidMap(graph) {
    const prevUidMap = Object.assign({}, graph.get("uidMap"));
    const uidMap = {};

    graph.getElements().forEach((el) => {
        const { type, uid, id } = el.attributes;
        if (type !== "Node") return;
        if (uid in uidMap) {
            uidMap[uid].push(id);
        } else {
            uidMap[uid] = [id];
        }
        delete prevUidMap[uid];
    });
    graph.set("uidMap", uidMap);
}

generateCells(graph, COLS, ROWS);

runEvents(graph, {
    stateInterval: STATE_UPDATE_MS,
    dataInterval: DATA_POINT_UPDATE_MS
});

paper.fitToContent({
    useModelGeometry: true,
    padding: 20,
    allowNewOrigin: "any"
});

function enableVirtualRendering(paper) {
    const paperContainer = paper.el.parentNode;

    let viewportArea;
    function updateViewportArea() {
        viewportArea = paper.clientToLocalRect(
            paperContainer.getBoundingClientRect()
        );
    }

    // Setup listeners
    updateViewportArea();
    paperContainer.addEventListener("scroll", updateViewportArea, false);
    paper.on("scale", updateViewportArea);

    // Paper `viewport` option
    // https://resources.jointjs.com/docs/jointjs/#dia.Paper.prototype.options.viewport
    paper.options.viewport = (view) => {
        const { model } = view;
        // Hide elements and links which are not in the viewport.
        const bbox = model.getBBox();
        if (model.isLink()) {
            // Vertical/horizontal links have zero width/height.
            bbox.width += 1;
            bbox.height += 1;
        }
        return viewportArea.intersect(bbox) !== null;
    };
}
