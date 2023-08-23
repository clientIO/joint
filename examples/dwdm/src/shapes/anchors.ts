import { anchors } from 'jointjs';
import { getPortLinks, isCellHidden } from './utils';

// Shift the anchor point of a link to avoid overlapping with other links (max 2 links per port).
export const multiLinkAnchor: anchors.Anchor = function(
    _endView,
    _endMagnet,
    _anchorReference,
    _opt,
    endType,
    linkView
) {
    const link = linkView.model;
    const graph = link.graph;
    if (endType === 'source') {
        const anchor = link.getSourcePoint();
        const source = link.getSourceElement();
        if (isCellHidden(source)) {
            // Center of the collapsed node (the source element position
            // might not be inside the collapsed node)
            anchor.x = source.getParentCell().getBBox().center().x;
            return anchor;
        }
        const { port } = link.source();
        if (getPortLinks(graph, source, port).length < 2) return anchor;
        const { group } = source.getPort(port);
        switch (group) {
            case 'top':
                anchor.x -= 3;
                break;
            case 'bottom':
                anchor.x += 3;
                break;
            case 'left':
                anchor.y += 3;
                break;
            case 'right':
                anchor.y -= 3;
                break;
        }
        return anchor;
    } else {
        const anchor = link.getTargetPoint();
        const target = link.getTargetElement();
        if (isCellHidden(target)) {
            // Center of the collapsed node (the target element position
            // might not be inside the collapsed node)
            anchor.x = target.getParentCell().getBBox().x;
            return anchor;
        }
        const { port } = link.target();
        if (getPortLinks(graph, target, port).length < 2) return anchor;
        const { group } = target.getPort(port);
        switch (group) {
            case 'top':
                anchor.x += 3;
                break;
            case 'bottom':
                anchor.x -= 3;
                break;
            case 'left':
                anchor.y -= 3;
                break;
            case 'right':
                anchor.y += 3;
                break;
        }
        return anchor;
    }
}
