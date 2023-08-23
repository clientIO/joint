import { dia } from 'jointjs';
import { Node, ExternalLink } from './shapes';
import {
    NODE_MARGIN_HORIZONTAL, NODE_PADDING_VERTICAL,
    NODE_PADDING_HORIZONTAL,
    NODE_HEIGHT, NODE_COLLAPSED_WIDTH
} from './theme';

export function layout(graph: dia.Graph): number {

    let x = NODE_MARGIN_HORIZONTAL;

    graph.getElements().forEach((node) => {
        if (!Node.isNode(node)) return;
        layoutNode(graph, node);
        const { width } = node.size();
        node.position(x, NODE_MARGIN_HORIZONTAL, { deep: true });
        x += width + NODE_MARGIN_HORIZONTAL * 2;
    });

    graph.getLinks().forEach((link) => {
        if (!ExternalLink.isExternalLink(link)) return;
        layoutExternalLink(graph, link);
    });

    return x - NODE_MARGIN_HORIZONTAL;
}

function layoutNode(_graph: dia.Graph, node: Node) {
    const height =  NODE_HEIGHT + Node.HEADER_HEIGHT;
    if (node.isCollapsed()) {
        node.resize(NODE_COLLAPSED_WIDTH, height);
    } else {
        node.fitToChildren({
            expandOnly: true,
            padding: {
                left: NODE_PADDING_HORIZONTAL,
                right: NODE_PADDING_HORIZONTAL,
                top: NODE_PADDING_VERTICAL + Node.HEADER_HEIGHT,
                bottom: NODE_PADDING_VERTICAL
            },
        });
        const { width } = node.size();
        node.resize(width, height);
    }
}

function layoutExternalLink(graph: dia.Graph, link: ExternalLink) {
    const { id, port } = link.target();
    const { group } = (<dia.Element>graph.getCell(id)).getPort(port);
    const { y } = link.getTargetPoint();
    const node = link.getTargetElement().getParentCell();
    const { x, width } = node.getBBox();
    // Set the link's source point further away from the node container
    // while keeping it vertically aligned with the target point
    // (currently only for the left and right ports)
    const offset = NODE_MARGIN_HORIZONTAL / 5 * 4;
    link.source({ x: ((group === 'left') ? x - offset : x + width + offset), y });
}
