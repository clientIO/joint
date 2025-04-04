import { dia, shapes } from "@joint/core";
import { Button, IElement, Step, Decision, isButton, ButtonLink } from "./shapes";
import { addEffect, effects, removeEffect } from "./effects";
import { DirectedGraph } from "@joint/layout-directed-graph";

export function fitContent(paper: dia.Paper) {
    paper.transformToFitContent({
        padding: {
            top: 100,
            left: 100,
            bottom: 250,
            right: 100
        },
        verticalAlign: 'middle',
        horizontalAlign: 'middle',
        contentArea: paper.model.getBBox()
    });
}

export function runLayout(paper: dia.Paper) {
    paper.freeze();
    const elements = paper.model.getElements();

    const otherElements: dia.Element[] = [];
    const buttons: dia.Element[] = [];

    elements.forEach(element => {
        if (isButton(element)) {
            buttons.push(element);
        } else {
            otherElements.push(element);
        }
    });


    const links = paper.model.getLinks();

    const otherLinks: dia.Link[] = [];
    const buttonLinks: dia.Link[] = [];

    links.forEach(link => {

        const target = link.getTargetCell();

        if (isButton(target)) {
            buttonLinks.push(link);
        } else {
            otherLinks.push(link);
        }
    });

    const rankSep = 100;

    DirectedGraph.layout([...otherElements, ...otherLinks, ...buttonLinks, ...buttons], {
        disableOptimalOrderHeuristic: true,
        setVertices: true,
        align: 'UL',
        rankSep,
        setPosition: (el, position) => {
            let x = position.x - position.width / 2;
            let y = position.y - position.height / 2;
            if (isButton(el)) {
                y -= rankSep / 2 - 10;
            }
            el.position(x, y);
        },
    });
    fitContent(paper);
    paper.unfreeze();
}

export function constructGraphLayer(parent: string | dia.Element, children: string[], graph: dia.Graph) {

    let parentElement = typeof parent === 'string' ? graph.getCell(parent) as dia.Element : parent;

    if (!parentElement) {
        parentElement = children.length > 1 ? Decision.create(parent as string) : Step.create(parent as string);
        graph.addCell(parentElement);
    }

    children.forEach(child => {
        const childElement = graph.getCell(child) as dia.Element ?? Step.create(child);
        graph.addCell(childElement);

        const link = makeConnection(parentElement, childElement, graph);
        graph.addCell(link);
    });
}

export function makeConnection(source: dia.Element, target: dia.Element, graph: dia.Graph, opt: any = {}) {

    const isButtonLink = isButton(source) || isButton(target);
    const Ctor = isButtonLink ? ButtonLink : shapes.standard.Link;

    const link = new Ctor({
        source: { id: source.id },
        target: { id: target.id }
    });

    graph.addCell(link, opt);
    return link;
}

export function addButtonToElement(element: dia.Element, graph: dia.Graph, opt: any = {}) {

    const maxChildren = (element as IElement).getMaxNumberOfChildren();
    const currentChildren = graph.getNeighbors(element, { outbound: true }).length;

    if (currentChildren >= maxChildren) return [null, null];

    const button = new Button();
    graph.addCell(button, opt);
    const link = makeConnection(element, button, graph, opt);
    return [link, button];
}

export function createListItem(thumbnail: SVGSVGElement, label: string) {

    const item = document.createElement('div');
    item.classList.add('connection-list-item');
    item.appendChild(thumbnail);
    const span = document.createElement('span');
    span.textContent = label;
    item.appendChild(span);

    return item;
}

export function createNewElementListItem(shape: dia.Element, parent: dia.Element, paper: dia.Paper) {
    const label = shape.get('type').split('.').pop();
    const item = createListItem(createBlankThumbnail(shape.get('type') satisfies ShapeType), label);

    const graph = paper.model;

    item.addEventListener('click', () => {
        graph.addCell(shape);
        makeConnection(parent, shape, graph);
        runLayout(paper);
    });

    return item;
}

export function createExistingElementListItem(parent: dia.Element, element: dia.Element, paper: dia.Paper) {
    const elementView = element.findView(paper) as dia.ElementView;

    const item = createListItem(createBlankThumbnail(element.get('type') satisfies ShapeType), String(element.id));

    item.addEventListener('mouseenter', () => {
        addEffect(elementView, effects.CONNECTION_TARGET);
    });

    item.addEventListener('mouseleave', () => {
        removeEffect(paper, effects.CONNECTION_TARGET);
    });

    item.addEventListener('click', () => {
        makeConnection(parent, element, paper.model, { uiConnection: true });
        removeEffect(paper, effects.CONNECTION_TARGET);
        runLayout(paper);
    });

    return item;
}

export enum ShapeType {
    Step = 'app.Step',
    End = 'app.End',
    Decision = 'app.Decision'
}

function getShapePath(shapeType: ShapeType): Element {

    if (shapeType === ShapeType.Step) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('rx', '5');
        rect.setAttribute('ry', '5');
        rect.setAttribute('width', '30');
        rect.setAttribute('height', '30');
        return rect;
    } else if (shapeType === ShapeType.End) {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', '15');
        ellipse.setAttribute('cy', '15');
        ellipse.setAttribute('rx', '15');
        ellipse.setAttribute('ry', '15');
        return ellipse;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 5 0 H 25 L 30 15 L 25 30 H 5 L 0 15 Z');
    return path;
}

export function createBlankThumbnail(shapeType: ShapeType): SVGSVGElement {
    const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer.setAttribute('width', '30');
    svgContainer.setAttribute('height', '30');
    svgContainer.setAttribute('viewBox', '-4 -4 38 38');

    const shape = getShapePath(shapeType);
    shape.setAttribute('fill', 'white');
    shape.setAttribute('stroke', '#333');
    shape.setAttribute('stroke-width', '2');
    svgContainer.appendChild(shape);

    return svgContainer;
}

// Check if removing a link would disconnect the graph
export function isBridge(graph: dia.Graph, linkToTest: dia.Link): boolean {
    // Store original source and target
    const sourceData = linkToTest.get('source');
    const targetData = linkToTest.get('target');

    if (!sourceData || !targetData) return false;

    const source = linkToTest.getSourceElement();
    const target = linkToTest.getTargetElement();

    linkToTest.disconnect();

    let targetVisited = false;

    graph.bfs(source, (element) => {
        if (element.id === target.id) {
            targetVisited = true;
        }

        return !targetVisited;
    })

    linkToTest.source(sourceData);
    linkToTest.target(targetData);

    return !targetVisited;
}

export function validChildrenCount(element: dia.Element, graph: dia.Graph) {
    const children = graph.getNeighbors(element, { outbound: true });
    return children.reduce((acc, child) => {
        if (isButton(child)) return acc;
        return acc + 1;
    }, 0);
}

export function validateButtons(graph: dia.Graph) {

    for (const element of graph.getElements()) {

        if (isButton(element)) continue;

        const button = graph.getNeighbors(element, { outbound: true }).find(isButton);

        const maxChildren = (element as IElement).getMaxNumberOfChildren();
        const currentChildren = validChildrenCount(element, graph);

        if (currentChildren < maxChildren && !button) {
            addButtonToElement(element, graph);
        } else if (currentChildren >= maxChildren && button) {
            button.remove();
        }
    }
}
