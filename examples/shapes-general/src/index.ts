import { dia } from '@joint/core';
import {
    LinkedProcess,
    Input,
    Mark,
    Actor,
    Parallelogram,
    Hexagon,
    Step,
    Trapezoid,
    Document,
    Shipment,
    Plus,
    Arrow,
    Note,
    Table,
    Cube,
    Card,
} from '@joint/shapes-general';
import {
    ParallelogramOffsetControl,
    HexagonOffsetControl,
    StepOffsetControl,
    TrapezoidOffsetControl,
    DocumentOffsetControl,
    PlusOffsetControl,
    ArrowOffsetControl,
    NoteOffsetControl,
    TableDividerTool,
    CubeCornerTool,
    CardOffsetControl,
} from '@joint/shapes-general-tools';

const namespace = {
    LinkedProcess,
    Input,
    Mark,
    Actor,
    Parallelogram,
    Hexagon,
    Step,
    Trapezoid,
    Document,
    Shipment,
    Plus,
    Arrow,
    Note,
    Table,
    Cube,
    Card,
};

const tools = {
    Parallelogram: [
        new ParallelogramOffsetControl({
            defaultOffset: 10,
        }),
    ],
    Hexagon: [
        new HexagonOffsetControl({
            defaultOffset: 20,
        }),
    ],
    Step: [
        new StepOffsetControl({
            defaultOffset: 20,
        }),
    ],
    Trapezoid: [
        new TrapezoidOffsetControl({
            defaultOffset: 20,
        }),
    ],
    Document: [
        new DocumentOffsetControl({
            defaultOffset: 20,
        }),
    ],
    Plus: [
        new PlusOffsetControl({
            defaultOffset: 50,
        }),
    ],
    Arrow: [new ArrowOffsetControl({})],
    Note: [
        new NoteOffsetControl({
            defaultOffset: 20,
        }),
    ],
    Table: [
        new TableDividerTool({
            defaultDividerX: 25,
            defaultDividerY: 25,
        })
    ],
    Cube: [
        new CubeCornerTool({
            defaultCornerX: 100/3,
            defaultCornerY: 40,
            lockAngle: true
        })
    ],
    Card: [
        new CardOffsetControl({
            defaultOffset: 20,
        })
    ]
};

const graph = new dia.Graph({}, { cellNamespace: namespace });

const paper = new dia.Paper({
    cellViewNamespace: namespace,
    el: document.getElementById('paper'),
    width: 800,
    height: 800,
    model: graph,
    frozen: true,
    async: true,
    interactive: false,
    guard: (evt) =>
        paper.getLayerNode(dia.Paper.Layers.TOOLS).contains(evt.target)
            ? false
            : true,
    background: {
        color: '#F3F7F6',
    },
});

paper.el.style.border = `1px solid #e2e2e2`;

const MARGIN = 10;
const COLUMNS_COUNT = 4;
const COLUMNS_GAP = 200;
const ROW_GAP = 140;

const elementTools = [];

const elements = Object.keys(namespace).map((name, index) => {
    const Constructor = namespace[name];
    const col = index % COLUMNS_COUNT;
    const row = Math.floor(index / COLUMNS_COUNT);
    const element = new Constructor({
        attrs: {
            root: {
                title: name,
                tabindex: 0,
            },
        },
    });
    let { width, height } = element.size();
    element.position(
        MARGIN + col * COLUMNS_GAP + (COLUMNS_GAP - width) / 2,
        MARGIN + row * ROW_GAP + (ROW_GAP - height) / 2
    );
    if (name in tools) {
        elementTools.push({
            element,
            tools: tools[name],
        });
    }
    return element;
});

graph.resetCells(elements);

elementTools.forEach(({ element, tools }) => {
    element.findView(paper).addTools(
        new dia.ToolsView({
            tools,
        })
    );
});

paper.unfreeze();
