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
        name: 'rounded',
        args: {
            radius: 4
        }
    },
    allowLink: (linkView) => {
        const { model } = linkView;

        if (!model.source().id || !model.target().id) return false;

        const target = model.getTargetElement();
        const source = model.getSourceElement();
        const [parent] = graph.getNeighbors(source, { inbound: true });
        // Forbid immediate parent-child connections
        if (parent === target) return false;

        return target.isElement() && !isButton(target);
    },
    validateConnection: (_cellViewS, _magnetS, cellViewT, _magnetT, _end, _linkView) => {
        const { model } = cellViewT;

        const source = _cellViewS.model as dia.Element;
        const [parent] = graph.getNeighbors(source, { inbound: true });
        // Forbid immediate parent-child connections
        if (parent === model) return false;

        const links = graph.getConnectedLinks(parent, { outbound: true });
        // Forbid connections to elements that are already connected
        if (links.some(link => link.getTargetCell() === model)) return false;

        return !isButton(model) && model.isElement();
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
