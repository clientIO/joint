import { dia, mvc } from '@joint/core';
import { Ellipse, Rectangle, Triangle, isButton, IElement } from './shapes';
import { runLayout, createExistingElementListItem, isBridge, createNewElementListItem, addButtonToElement, validChildrenCount } from './utils';
import { addEffect, effects, removeEffect } from './effects';
import { LinkRemoveTool, ElementRemoveTool } from './RemoveTool';

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
            'add': onAdd
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

function onAdd({ graph, paper }: ElementControllerArgs, cell: dia.Cell, _collection: mvc.Collection, opt: any) {
    if (isButton(cell) || opt.preview) return;

    closeConnectionsList(paper);
    if (cell.isLink()) {

        // If the link is created from the UI, check if the source element has reached the max number of children
        if (opt.uiConnection) {
            const source = cell.getSourceElement();

            const maxChildren = (source as IElement).getMaxNumberOfChildren();
            const children = graph.getNeighbors(source, { outbound: true });
            const currentChildren = validChildrenCount(source, graph);

            if (currentChildren >= maxChildren) {
                const button = children.find(child => isButton(child));
                button?.remove();
            }
        }

        return;
    }

    const maxChildren = (cell as IElement).getMaxNumberOfChildren();

    if (maxChildren === 0) return;

    addButtonToElement(cell as dia.Element, graph);
}

function onLinkConnect({ paper, graph }: ElementControllerArgs, linkView: dia.LinkView) {
    const { model } = linkView;

    const button = model.getSourceElement();

    // Button has only one neighbor
    const [parent] = graph.getNeighbors(button, { inbound: true });
    model.source({ id: parent.id });

    const maxChildren = (parent as IElement)?.getMaxNumberOfChildren();
    const currentChildren = validChildrenCount(parent, graph);

    if (currentChildren >= maxChildren) {
        button.remove();
    }

    runLayout(paper);
}

// Add a function to handle link clicks
function onLinkPointerClick({ paper, graph }: ElementControllerArgs, linkView: dia.LinkView) {
    paper.removeTools();

    const target = linkView.model.getTargetElement();

    // Don't show remove tool if the target is a button
    if (isButton(target)) return;

    const removeTool = new LinkRemoveTool({
        distance: '50%',
        disabled: isBridge(graph, linkView.model)
    });
    linkView.addTools(new dia.ToolsView({
        tools: [removeTool]
    }));
}

function onBlankPointerClick({ paper }: ElementControllerArgs) {
    closeConnectionsList(paper);
    paper.removeTools();
}

function onElementPointerClick({ paper, graph }: ElementControllerArgs, elementView: dia.ElementView) {

    closeConnectionsList(paper);
    paper.removeTools();
    const { model } = elementView;
    const [parent] = graph.getNeighbors(model, { inbound: true });

    if (!isButton(model)) {
        // Add remove button if the element can be removed

        let canBeRemoved = true;

        if (!parent) {
            canBeRemoved = false;
        } else {
            const maxChildren = (parent as IElement)?.getMaxNumberOfChildren();
            const currentChildren = validChildrenCount(parent, graph) - 1;
            const possibleChildren = validChildrenCount(model, graph);

            canBeRemoved = currentChildren + possibleChildren <= maxChildren;
        }

        const removeButton = new ElementRemoveTool({
            x: '100%',
            y: '50%',
            offset: { x: 10 },
            disabled: !canBeRemoved
        });

        const elementsTools = new dia.ToolsView({
            tools: [removeButton]
        });

        elementView.addTools(elementsTools);
        return;
    }

    openConnectionsList(paper, parent);
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

    addEffect(parent.findView(paper), effects.CONNECTION_SOURCE);

    const graph = paper.model;

    // New Connections
    const addElementSubtitle = document.createElement('h3');
    addElementSubtitle.textContent = 'Add element:';
    connectionsList.appendChild(addElementSubtitle);

    const addElementList = document.createElement('div');
    addElementList.classList.add('element-list');

    const newRectItem = createNewElementListItem(Rectangle.create(), parent, paper);
    const newEllipseItem = createNewElementListItem(Ellipse.create(), parent, paper);
    const newTriangleItem = createNewElementListItem(Triangle.create(), parent, paper);

    addElementList.appendChild(newRectItem);
    addElementList.appendChild(newEllipseItem);
    addElementList.appendChild(newTriangleItem);

    connectionsList.appendChild(addElementList);

    // Existing Connections

    const intermediateChildren = graph.getNeighbors(parent, { outbound: true });

    const elements = graph
        .getElements()
        .filter((element) => !isButton(element) && element.id !== parent.id)
        .filter((element) => !intermediateChildren.some(child => child.id === element.id));

    if (elements.length === 0) return;

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
