import { dia, elementTools, linkTools } from "@joint/core";
import { isButton } from "./shapes";
import { runLayout } from "./utils";

interface ElementRemoveToolOptions extends elementTools.Button.Options {
    disabled?: boolean;
}

export class ElementRemoveTool extends elementTools.Remove {

    constructor(opt: ElementRemoveToolOptions = { disabled: false }) {
        opt.action = (_evt: dia.Event, view: dia.ElementView, tool: elementTools.Button) => {
            if (opt.disabled) return;

            const { model } = view;

            const paper = view.paper;
            const graph = paper.model;

            // Clean up button
            const button = graph.getNeighbors(model, { outbound: true }).find(isButton);
            button?.remove();

            const predecessors = graph.getNeighbors(model, { inbound: true });
            const parent = predecessors[0];

            const inboundLinks = graph.getConnectedLinks(model, { inbound: true });
            inboundLinks.forEach((link) => link.remove());

            const possibleSelfLinks = graph.getConnectedLinks(model, { outbound: true }).filter(link => link.getTargetCell() === parent);
            possibleSelfLinks.forEach((link) => link.remove());

            graph.transferCellConnectedLinks(model, parent);

            view.model.remove({ ui: true, tool: tool.cid });

            runLayout(paper);
        }

        super(opt);
        this.el.classList.toggle('disabled', opt.disabled);
    }
}

interface LinkRemoveToolOptions extends linkTools.Button.Options {
    disabled?: boolean;
}

export class LinkRemoveTool extends linkTools.Remove {
    constructor(opt: LinkRemoveToolOptions = { disabled: false }) {

        opt.action = (_evt: dia.Event, view: dia.LinkView, tool: linkTools.Remove) => {
            if (opt.disabled) return;

            const paper = view.paper;
            view.model.remove({ ui: true, cid: tool.cid });

            runLayout(paper);
        }

        super(opt);
        this.el.classList.toggle('disabled', opt.disabled);
    }
}
