import { dia, shapes } from '@joint/core';

const colors = [
    '#4361ee',
    '#4d908e',
    '#f72585',
    '#7209b7',
    '#4cc9f0',
    '#3a0ca3',
    '#f94144',
    '#277da1'
];

// Create different graph types
export const createGraph = (graph: dia.Graph, type: string) => {

    switch (type) {
        case 'tree':
            createTreeGraph(graph);
            break;
        case 'dag':
            createDAGGraph(graph);
            break;
        case 'network':
            createNetworkGraph(graph);
            break;
        case 'cycle':
            createCycleGraph(graph);
            break;
        case 'complete':
            createCompleteGraph(graph);
            break;
        default:
            createTreeGraph(graph);
    }
};

// Create a tree graph
const createTreeGraph = (graph: dia.Graph) => {
    const root = createNode('Root', colors[0]);

    // Level 1
    const child1 = createNode('Child 1', colors[1]);
    const child2 = createNode('Child 2', colors[1]);
    const child3 = createNode('Child 3', colors[1]);

    // Level 2
    const grandchild1 = createNode('Grandchild 1', colors[2]);
    const grandchild2 = createNode('Grandchild 2', colors[2]);
    const grandchild3 = createNode('Grandchild 3', colors[2]);
    const grandchild4 = createNode('Grandchild 4', colors[2]);
    const grandchild5 = createNode('Grandchild 5', colors[2]);

    // Level 3
    const leaf1 = createNode('Leaf 1', colors[3]);
    const leaf2 = createNode('Leaf 2', colors[3]);
    const leaf3 = createNode('Leaf 3', colors[3]);
    const leaf4 = createNode('Leaf 4', colors[3]);

    graph.resetCells([
        root,
        child1,
        child2,
        child3,
        grandchild1,
        grandchild2,
        grandchild3,
        grandchild4,
        grandchild5,
        leaf1,
        leaf2,
        leaf3,
        leaf4,
        // Connect nodes
        ...connectNodes(root, [child1, child2, child3]),
        ...connectNodes(child1, [grandchild1, grandchild2]),
        ...connectNodes(child2, [grandchild3]),
        ...connectNodes(child3, [grandchild4, grandchild5]),
        ...connectNodes(grandchild1, [leaf1]),
        ...connectNodes(grandchild2, [leaf2]),
        ...connectNodes(grandchild4, [leaf3, leaf4])
    ]);
};

// Create a directed acyclic graph (DAG)
const createDAGGraph = (graph: dia.Graph) => {
    const nodes: dia.Element[] = [];

    // Create nodes
    for (let i = 0; i < 10; i++) {
        nodes.push(createNode(`Node ${i + 1}`, getRandomColor()));
    }

    graph.resetCells([
        ...nodes,
        ...connectNodes(nodes[0], [nodes[1], nodes[2], nodes[3]]),
        ...connectNodes(nodes[1], [nodes[4], nodes[5]]),
        ...connectNodes(nodes[2], [nodes[5], nodes[6]]),
        ...connectNodes(nodes[3], [nodes[6], nodes[7]]),
        ...connectNodes(nodes[4], [nodes[8]]),
        ...connectNodes(nodes[5], [nodes[8]]),
        ...connectNodes(nodes[6], [nodes[9]]),
        ...connectNodes(nodes[7], [nodes[9]])
    ])
};

// Create a network graph
const createNetworkGraph = (graph: dia.Graph) => {
    const nodes: dia.Element[] = [];

    // Create nodes
    for (let i = 0; i < 12; i++) {
        nodes.push(createNode(`Node ${i + 1}`, getRandomColor()));
    }

    graph.resetCells([
        ...nodes,
        // Connect nodes in a network-like structure
        ...connectNodes(nodes[0], [nodes[1], nodes[2], nodes[3]]),
        ...connectNodes(nodes[1], [nodes[2], nodes[4], nodes[5]]),
        ...connectNodes(nodes[2], [nodes[3], nodes[5], nodes[6]]),
        ...connectNodes(nodes[3], [nodes[6], nodes[7]]),
        ...connectNodes(nodes[4], [nodes[5], nodes[8]]),
        ...connectNodes(nodes[5], [nodes[6], nodes[8], nodes[9]]),
        ...connectNodes(nodes[6], [nodes[7], nodes[9], nodes[10]]),
        ...connectNodes(nodes[7], [nodes[10]]),
        ...connectNodes(nodes[8], [nodes[9], nodes[11]]),
        ...connectNodes(nodes[9], [nodes[10], nodes[11]]),
        ...connectNodes(nodes[10], [nodes[11]])
    ]);
};

// Create a cycle graph
const createCycleGraph = (graph: dia.Graph) => {
    const nodes: dia.Element[] = [];
    const links: dia.Link[] = [];

    // Create nodes
    for (let i = 0; i < 8; i++) {
        nodes.push(createNode(`Node ${i + 1}`, getRandomColor()));
    }

    // Connect nodes in a cycle
    for (let i = 0; i < nodes.length; i++) {
        const nextIndex = (i + 1) % nodes.length;
        links.push(...connectNodes(nodes[i], [nodes[nextIndex]]));
    }

    graph.resetCells([
        ...nodes,
        ...links,
        // Add some cross connections
        ...connectNodes(nodes[0], [nodes[4]]),
        ...connectNodes(nodes[1], [nodes[5]]),
        ...connectNodes(nodes[2], [nodes[6]]),
        ...connectNodes(nodes[3], [nodes[7]])
    ])
};

// Create a complete graph
const createCompleteGraph = (graph: dia.Graph) => {
    const nodes: dia.Element[] = [];
    const links: dia.Link[] = [];

    // Create nodes (limit to 6 for readability)
    for (let i = 0; i < 6; i++) {
        nodes.push(createNode(`Node ${i + 1}`, getRandomColor()));
    }

    // Connect each node to every other node
    for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
            if (i !== j) {
                links.push(createLink(nodes[i], nodes[j]));
            }
        }
    }

    graph.resetCells([
        ...nodes,
        ...links
    ]);
};

// Helper function to create a node
const createNode = (label: string, color: string): dia.Element => {
    const node = new shapes.standard.Rectangle({
        size: { width: 100, height: 40 },
        attrs: {
            body: {
                fill: color,
                stroke: '#333',
                strokeWidth: 1,
                rx: 5,
                ry: 5
            },
            label: {
                text: label,
                fill: 'white',
                fontSize: 12,
                fontWeight: 'bold',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle'
            }
        }
    });

    return node;
};

// Helper function to create a link
const createLink = (source: dia.Element, target: dia.Element): dia.Link => {

    const label = `${source.attr('label/text')} -> ${target.attr('label/text')}`;

    const link = new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
        labelSize: measureLabelText(label),
        labels: [
            {
                position: {
                    distance: 0,
                    offset: 0
                },
                attrs: {
                    rect: {
                        fill: 'white',
                        stroke: '#333',
                        strokeWidth: 1,
                        rx: 3,
                        ry: 3,
                        height: 'calc(h + 10)',
                        width: 'calc(w + 10)',
                        x: 'calc(x - 5)',
                        y: 'calc(y - 5)',
                        pointerEvents: 'none'
                    },
                    text: {
                        text: label,
                        fill: '#333',
                        fontSize: 10,
                        fontWeight: 'normal',
                        textAnchor: 'middle',
                        textVerticalAnchor: 'middle',
                        pointerEvents: 'none'
                    }
                }
            }
        ]
    });

    return link;
};

// Helper function to connect a node to multiple targets
const connectNodes = (source: dia.Element, targets: dia.Element[]) => {
    return targets.map(target => createLink(source, target));
};

// Helper function to get a random color
const getRandomColor = (): string => {

    return colors[Math.floor(Math.random() * colors.length)];
};

const measureLabelText = (text: string): { width: number, height: number } => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    context.font = '10px sans-serif';

    const metrics = context.measureText(text);

    return {
        width: metrics.width + 10,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 10
    };
};
