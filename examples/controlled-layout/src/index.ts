import { dia, shapes } from "@joint/core";
import { constructGraphLayer, runLayout, fitContent, addButtonToElement } from "./utils";
import { isButton } from "./shapes";

import '../css/styles.css';
import { ElementController } from "./ElementController";

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.querySelector('#paper'),
    width: '100%',
    height: '100%',
    magnetThreshold: 'onleave',
    clickThreshold: 10,
    defaultConnector: {
        name: 'straight',
        args: {
            cornerType: 'cubic',
            cornerRadius: 5,
        }
    },
    allowLink: (linkView) => {
        const { model } = linkView;

        const target = model.getTargetElement();
        const source = model.getSourceElement();

        if (!source || !target) return false;

        // Forbid immediate parent-child connections
        if (source === target) return false;

        return target.isElement() && !isButton(target);
    },
    validateConnection: (cellViewS, _magnetS, cellViewT, _magnetT, _end, _linkView) => {
        const source = cellViewS.model;
        const target = cellViewT.model;

        if (source.isLink() || target.isLink()) return false;

        // Forbid immediate parent-child connections
        if (source === target) return false;

        const links = graph.getConnectedLinks(source, { outbound: true });
        // Forbid connections to elements that are already connected
        if (links.some(link => link.getTargetCell() === target)) return false;

        return !isButton(target);
    },
    async: true,
    frozen: true,
    // Enable interaction only for buttons
    interactive: (cellView: dia.CellView) => {
        if (!isButton(cellView.model)) return false;

        return {
            addLinkFromMagnet: true,
            elementMove: false
        }
    },
    highlighting: {
        [dia.CellView.Highlighting.CONNECTING]: false
    },
    connectionStrategy: (end, _endView, _endMagnet, _coords, _link, endType) => {

        if (endType === 'target') return end;

        const button = graph.getCell(end.id);
        const [el] = graph.getNeighbors(button as dia.Element, { inbound: true });
        // Reconnect the link dragged from the button to the parent element
        end.id = el.id;

        return end;
    },
    defaultAnchor: (endView, _endMagnet, _anchorReference, _args, endType, linkView) => {
        const endBBox = endView.model.getBBox();

        const sourceCell = linkView.model.getSourceCell();
        const targetCell = linkView.model.getTargetCell();

        // Only apply relative logic if both ends are connected to elements
        if (sourceCell && targetCell) {

            const sourceBBox = sourceCell.getBBox();
            const targetBBox = targetCell.getBBox();

            // Check if the source element is visually above the target element
            if (sourceBBox.y < targetBBox.y) {
                // Source is above Target
                if (endType === 'source') {
                    return sourceBBox.bottomMiddle(); // Source anchor: Bottom Middle
                } else { // endType === 'target'
                    return targetBBox.topMiddle();    // Target anchor: Top Middle
                }
            } else {
                // Source is below or level with Target
                if (endType === 'source') {
                    return sourceBBox.topMiddle();    // Source anchor: Top Middle
                } else { // endType === 'target'
                    return targetBBox.bottomMiddle(); // Target anchor: Bottom Middle
                }
            }
        }

        // Fallback if one end is a point or views not found
        return endBBox.center();
    }
});

constructGraphLayer('E1', ['E2', 'E3'], graph);

const elementController = new ElementController({
    graph,
    paper
});

elementController.startListening();

graph.getElements().forEach((source) => {
    addButtonToElement(source, graph);
});

runLayout(paper);
window.addEventListener('resize', () => fitContent(paper));
