import { dia } from '@joint/core';
import { createLink, createNode, createParentNode } from './builders';
import { GraphBlueprint } from './blueprints';

import type { PaletteCycler } from './types';

export const buildGraph = (blueprint: GraphBlueprint, palette: PaletteCycler): dia.Cell[] => {
    const nodeMap = new Map<string, dia.Element>();

    blueprint.nodes.forEach((spec) => {
        const fill = palette.next();
        const element = spec.kind === 'parent'
            ? createParentNode(spec.label, fill, spec.size ?? { width: 220, height: 160 })
            : createNode(spec.label, fill, {
                width: spec.width,
                height: spec.height,
                variant: spec.variant,
                fontSize: spec.fontSize,
                fontWeight: spec.fontWeight
            });

        nodeMap.set(spec.id, element);
    });

    blueprint.nodes.forEach((spec) => {
        if (!spec.parentId) {
            return;
        }
        const parent = nodeMap.get(spec.parentId);
        const child = nodeMap.get(spec.id);
        if (parent && child) {
            parent.embed(child);
        }
    });

    const links: dia.Link[] = [];
    blueprint.links.forEach((linkSpec) => {
        const source = nodeMap.get(linkSpec.from);
        const target = nodeMap.get(linkSpec.to);
        if (!source || !target) {
            return;
        }
        links.push(
            createLink(source, target, {
                label: linkSpec.label,
                ...linkSpec.options
            })
        );
    });

    return [...nodeMap.values(), ...links];
};
