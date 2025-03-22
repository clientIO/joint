import { dia, linkTools, mvc } from '@joint/core';
import { Ellipse, Rectangle, Triangle, isButton } from './shapes';
import { runLayout, createListItem, ShapeType, createBlankThumbnail, makeConnection, addButtonToElement, createExistingElementListItem, isBridge } from './utils';
import { addEffect, effects, removeEffect } from './effects';
import { RemoveTool } from './RemoveTool';

interface ElementControllerArgs {
    graph: dia.Graph;
    paper: dia.Paper;
}

export class ElementController extends mvc.Listener<[ElementControllerArgs]> {

    get context() {
        return this.callbackArguments[0];
    }

    constructor(args: ElementControllerArgs) {
        super(args);
    }

    startListening() {
        const { paper, graph } = this.context;

        this.listenTo(graph, {
            'remove': onRemove
        })

        this.listenTo(paper, {
            'link:connect': onLinkConnect,
            'link:pointerclick': onLinkPointerClick,
            'blank:pointerclick': onBlankPointerClick,
            'element:pointerclick': onElementPointerClick,
            'cell:highlight': onCellHighlight,
            'cell:unhighlight': onCellUnhighlight
        })
    }
}

function onRemove({ paper }: ElementControllerArgs, _cell: dia.Cell, _: any, opt: any) {
    if (!opt.ui) return;
    runLayout(paper);
}

function onLinkConnect({ paper, graph }: ElementControllerArgs, linkView: dia.LinkView) {
    const { model } = linkView;

    const button = model.getSourceElement();

    // Button has only one neighbor
    const [parent] = graph.getNeighbors(button, { inbound: true });
    model.source({ id: parent.id });

    runLayout(paper);
}

// Add a function to handle link clicks
function onLinkPointerClick({ paper, graph }: ElementControllerArgs, linkView: dia.LinkView) {
    paper.removeTools();

    // Only show remove tool if removing the link won't break the graph
    if (!isBridge(graph, linkView.model)) {
        const removeTool = new linkTools.Remove();
        linkView.addTools(new dia.ToolsView({
            tools: [removeTool]
        }));
    }
}

function onBlankPointerClick({ paper }: ElementControllerArgs) {
    closeConnectionsList(paper);
    paper.removeTools();
}

function onElementPointerClick({ paper, graph }: ElementControllerArgs, elementView: dia.ElementView) {

    closeConnectionsList(paper);
    paper.removeTools();
    const { model } = elementView;

    if (!isButton(model)) {
        // Add remove button
        if (graph.isSource(model)) return;
        const removeButton = new RemoveTool({
            x: '100%',
            y: '50%',
            offset: { x: 10 }
        });

        const elementsTools = new dia.ToolsView({
            tools: [removeButton]
        });

        elementView.addTools(elementsTools);
        return;
    }

    const [parent] = graph.getNeighbors(model, { inbound: true });
    openConnectionsList(paper, parent);

    addEffect(parent.findView(paper), effects.CONNECTION_SOURCE);
}

function onCellHighlight(_context: ElementControllerArgs, cellView: dia.CellView, _node: SVGElement, { type }: { type: dia.CellView.Highlighting }) {
    if (type !== dia.CellView.Highlighting.CONNECTING) return;

    addEffect(cellView, effects.CONNECTION_SOURCE);
}

function onCellUnhighlight({ paper }: ElementControllerArgs, _cellView: dia.CellView, _node: SVGElement, { type }: { type: dia.CellView.Highlighting }) {
    if (type !== dia.CellView.Highlighting.CONNECTING) return;

    removeEffect(paper, effects.CONNECTION_SOURCE);
}

const connectionsList = document.querySelector<HTMLDivElement>('#connections-list')!;

function openConnectionsList(paper: dia.Paper, parent: dia.Element) {
    connectionsList.style.display = 'block';

    const graph = paper.model;

    const elements = graph.getElements().filter((element) => !isButton(element) || element.id === parent.id);

    // New Connections
    const addElementSubtitle = document.createElement('h3');
    addElementSubtitle.textContent = 'Add element:';
    connectionsList.appendChild(addElementSubtitle);

    const addElementList = document.createElement('div');
    addElementList.classList.add('element-list');

    const newRectItem = createListItem(createBlankThumbnail(ShapeType.Rectangle));
    const newEllipseItem = createListItem(createBlankThumbnail(ShapeType.Ellipse));
    const newTriangleItem = createListItem(createBlankThumbnail(ShapeType.Triangle));

    addElementList.appendChild(newRectItem);
    addElementList.appendChild(newEllipseItem);
    addElementList.appendChild(newTriangleItem);

    newRectItem.addEventListener('click', () => {
        const rect = Rectangle.create()
        graph.addCell(rect);
        makeConnection(parent, rect, paper);
        addButtonToElement(rect, paper);
        runLayout(paper);
    });

    newEllipseItem.addEventListener('click', () => {
        const ellipse = Ellipse.create();
        graph.addCell(ellipse);
        makeConnection(parent, ellipse, paper);
        addButtonToElement(ellipse, paper);
        runLayout(paper);
    });

    newTriangleItem.addEventListener('click', () => {
        const triangle = Triangle.create();
        graph.addCell(triangle);
        makeConnection(parent, triangle, paper);
        addButtonToElement(triangle, paper);
        runLayout(paper);
    });

    connectionsList.appendChild(addElementList);

    // Existing Connections
    const connectionsSubtitle = document.createElement('h3');
    connectionsSubtitle.textContent = 'Make connection to:';
    connectionsList.appendChild(connectionsSubtitle);

    const availableConnections = document.createElement('div');
    availableConnections.classList.add('element-list');

    elements.forEach((element) => {
        availableConnections.appendChild(createExistingElementListItem(parent, element, paper));
    });

    connectionsList.appendChild(availableConnections);
}

function closeConnectionsList(paper: dia.Paper) {
    connectionsList.style.display = 'none';
    // Clear all child elements from the connections list
    connectionsList.innerHTML = '';
    removeEffect(paper, effects.CONNECTION_SOURCE);
}
