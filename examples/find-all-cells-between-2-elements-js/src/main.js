const { dia, shapes, highlighters, layout } = joint;

// Paper

const paperContainer = document.getElementById("paper-container");

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: "100%",
    height: "100%",
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: "#F3F7F6" },
    interactive: false,
    defaultConnectionPoint: {
        name: "boundary"
    },
    defaultConnector: {
        name: "rounded"
    },
    clickThreshold: 10
});

paperContainer.appendChild(paper.el);

// Adjacency list.
const list = {
    a: ["b", "c"],
    b: ["d", "e"],
    c: ["f", "g"],
    f: ["b"],
    e: ["c"],
    h: ["f", "g"],
    i: ["h", "a", "d", "g"],
    j: ["a"],
    k: ["l"],
    l: ["h"],
    m: ["l"]
};

// Create a node with `id` at the position `p`.
function n(id) {
    const node = new shapes.standard.Circle({
        id: id,
        size: { width: 40, height: 40 },
        attrs: {
            label: {
                text: id.toUpperCase(),
                fontSize: 20,
                fontFamily: "sans-serif"
            }
        }
    });
    node.addTo(graph);
    return node;
}

// Create a link between a source element with id `s` and target element with id `t`.
function l(s, t) {
    const link = new shapes.standard.Link({
        id: [s, t].sort().join(),
        source: { id: s },
        target: { id: t },
        z: -1
    });
    link.addTo(graph);
    return link;
}

// Construct nodes and links based on the adjacency list.
Object.keys(list).forEach((parent) => {
    const neighbors = list[parent];
    n(parent);
    neighbors.forEach((adj) => {
        // Do not create the node if it's already in the graph.
        if (!graph.getCell(adj)) n(adj);
        l(parent, adj);
    });
});

layout.DirectedGraph.layout(graph, {
    marginX: 100,
    marginY: 50,
    setVertices: true,
    nodeSep: 60
});

let start;
let subgraph;

function selectStart(element) {
    const id = "start-highlight";
    if (start) {
        highlighters.mask.remove(start.findView(paper), id);
    }
    start = element;
    highlighters.mask.add(element.findView(paper), "body", id, {
        padding: 2,
        attrs: {
            stroke: "#4666E5",
            "stroke-width": 4
        }
    });
}

selectStart(graph.getCell("a"));

function highlightSubgraph(elements, valid) {
    const id = "subgraph-highlighter";
    if (subgraph) {
        subgraph.forEach((cell) => {
            highlighters.addClass.remove(cell.findView(paper), id);
        });
    }
    subgraph = graph.getSubgraph(elements);
    if (!valid) {
        // No subgraph found
        subgraph.forEach((cell) => {
            highlighters.addClass.add(cell.findView(paper), "body", id, {
                className: "no-subgraph"
            });
        });
    } else {
        subgraph.forEach((cell) => {
            highlighters.addClass.add(
                cell.findView(paper),
                cell.isLink() ? "line" : "body",
                id,
                { className: "subgraph" }
            );
        });
    }
}

paper.on("element:pointerclick", ({ model: element }) => {
    selectStart(element);
    highlightSubgraph([]);
});

// When the user hovers over an element,
// highlight all the elements that are between the Start and the current element.
paper.on("element:mouseenter", ({ model: end }) => {
    const between = getElementsBetween(start, end);
    if (between.length > 0) {
        highlightSubgraph([start, end, ...between], true);
    } else {
        highlightSubgraph(
            [start, end],
            graph.isNeighbor(start, end, { outbound: true })
        );
    }
});

paper.on("element:mouseleave", (elementView) => {
    highlightSubgraph([]);
});

// This method will return all the elements that can be found in whatever
// possible permutation of connections between the Start and the End element.
function getElementsBetween(start, end) {
    const start2end = getSuccessors(start, end);
    const end2start = getPredecessors(end, start);
    const intersection = new Set();
    start2end.forEach((element) => {
        if (end2start.includes(element)) {
            intersection.add(element);
        }
    });
    return Array.from(intersection);
}

function getElements(element, terminator, opt) {
    const res = [];
    graph.search(
        element,
        (el) => {
            if (el !== element) {
                res.push(el);
            }
            if (el === terminator) {
                return false;
            }
        },
        opt
    );
    return res;
}

function getSuccessors(element, terminator) {
    return getElements(element, terminator, { outbound: true });
}

function getPredecessors(element, terminator) {
    return getElements(element, terminator, { inbound: true });
}

// Styling

const color = "#4666E5";
const invalidColor = "#FF4365";
const styles = V.createSVGStyle(`
    .joint-element .subgraph {
        stroke: ${color};
        fill: ${color};
        fill-opacity: 0.2;
    }
    .joint-element .no-subgraph {
        stroke: ${invalidColor};
        fill: ${invalidColor};
        fill-opacity: 0.2;
    }
    .joint-link .subgraph {
        stroke: ${color};
        stroke-dasharray: 5;
        stroke-dashoffset: 10;
        animation: dash 0.5s infinite linear;
    }
    @keyframes dash {
        to {
            stroke-dashoffset: 0;
        }
    }
`);
paper.svg.prepend(styles);
