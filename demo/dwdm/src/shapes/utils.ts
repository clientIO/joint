
import { dia } from 'jointjs';

export function isCellHidden(cell: dia.Cell): boolean {
    return Boolean(cell.get('hidden'));
};

export function setCellVisibility(cell: dia.Cell, visible: boolean): void {
    cell.set('hidden', !visible);
};

export function getPortLinks(graph: dia.Graph, element: dia.Element, portId: dia.Cell.ID): dia.Link[] {
    const outboundLinks = graph.getConnectedLinks(element, { outbound: true }).filter((link) => {
        return portId === link.source().port;
    });
    const inboundLinks = graph.getConnectedLinks(element, { inbound: true }).filter((link) => {
        return portId === link.target().port;
    });
    return [...outboundLinks, ...inboundLinks];
}
