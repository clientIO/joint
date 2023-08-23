import { dia } from 'jointjs';
import { Node, Link, NodeLink } from './shapes';

interface INode {
    x: number;
    y: number;
    name: string;
    ip: string;
    image: string;
    cards: ICard[];
}

interface ICard {
    ctor: any;
    id: string;
    x: number;
    y: number;
    ports: ICardPort[];
    links: {
        [portId: string]: ILink[];
    }
}

interface ICardPort {
    group: string;
    id: string;
}

interface ILink {
    ctor: any;
    id: string;
    port: string;
}

interface IExternalLink extends ILink {
    description: string;
}

export type IData = {
    nodes: INode[];
    links: IExternalLink[];
}

export function load(graph: dia.Graph, data: IData) {

    const linksMap: { [idHash: string]: Link } = {};

    data.nodes.forEach((node) => {

        // Create the node container
        const { x, y, name, ip, image, cards } = node;
        const nodeModel = new Node({
            position: { x, y },
            name,
            ip,
            image,
            z: 1,
        });
        nodeModel.setName(name);
        nodeModel.setIp(ip);
        nodeModel.addTo(graph);

        // Create cards inside the node container
        cards.forEach(({ id: childId, ctor, x: childX, y: childY, ports, links }) => {
            const cardModel = new ctor({
                id: childId,
                position: { x: x + childX, y: y + childY + Node.HEADER_HEIGHT },
                ports: { items: ports.map(({ id, group }) => ctor.createPort(id, group)) },
                attrs: { label: { text: childId }},
                z: 2,
            });
            cardModel.addTo(graph);
            nodeModel.embed(cardModel);
            Object.keys(links).forEach((sourcePortId) => {
                links[sourcePortId].forEach(({ ctor, id, port }) => {
                    // Check if the link with opposite direction already exists
                    let link = linksMap[`${id}:${port}:${cardModel.id}:${sourcePortId}`];
                    if (link) {
                        if (!NodeLink.isNodeLink(link) || link.isBidirectional()) return;
                        // If the link exists but it's not bidirectional, make it bidirectional
                        link.toBidirectional();
                    } else {
                        link = new ctor({
                            source: { id: cardModel.id, port: sourcePortId },
                            target: { id, port },
                            z: 3
                        });
                        linksMap[`${cardModel.id}:${sourcePortId}:${id}:${port}`] = link;
                    }
                });
            });
        });
    });

    // Embed the links (not fibers) into the node containers
    const linkModels = Object.values(linksMap);
    graph.addCells(linkModels);
    linkModels.forEach((linkModel) => linkModel.reparent());

    // Add external links
    data.links.forEach(({ ctor, id, port, description }) => {
        const linkModel = new ctor({
            target: { id, port },
            z: 2
        });
        linkModel.setDescription(description);
        linkModel.addTo(graph);
    });
}
