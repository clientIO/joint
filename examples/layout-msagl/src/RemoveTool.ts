import { dia, elementTools } from "@joint/core";
import { isButton } from "./shapes";

export class RemoveTool extends elementTools.Remove {

    constructor(opt?: elementTools.Button.Options) {
        opt.action = (_evt: dia.Event, view: dia.ElementView, tool: elementTools.Button) => {
            const { model } = view;

            const graph = view.paper.model;

            // Clean up button
            const [button] = graph.getNeighbors(model, { outbound: true }).filter((cell) => isButton(cell));
            button.remove();

            const [parent] = graph.getNeighbors(model, { inbound: true });

            const inboundLinks = graph.getConnectedLinks(model, { inbound: true });
            inboundLinks.forEach((link) => link.remove());

            graph.transferCellConnectedLinks(model, parent);

            view.model.remove({ ui: true, tool: tool.cid });
        }
        super(opt);
    }
}
