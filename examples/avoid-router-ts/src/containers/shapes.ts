import { shapes, util } from '@joint/core';

// A simple "pool"-style container: a titled box meant to hold embedded
// cells. It plays no special role for the router itself - `routeSubgraph()`
// only cares about the cells passed to it (here, via `getEmbeddedCells()`
// for a container's own content, or the container itself when routing
// container-to-container links, treating it as a single opaque obstacle).
export class Container extends shapes.standard.HeaderedRectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'Container',
            z: 0,
            attrs: {
                root: {
                    magnetSelector: 'body',
                },
                body: {
                    fill: '#FFFFFF',
                    stroke: '#B9C2C8',
                    strokeWidth: 1,
                    rx: 2,
                    ry: 2,
                },
                header: {
                    fill: '#F3F7F6',
                    stroke: '#B9C2C8',
                    strokeWidth: 1,
                    height: 32,
                },
                headerText: {
                    fontFamily: 'sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    fill: '#322A49',
                    y: 16,
                },
                bodyText: {
                    text: '',
                },
            },
        }, super.defaults);
    }
}

// A link between two containers, kept visually distinct from the plain
// `Edge`s used for the nodes inside a container, since it represents a
// container-to-container relationship rather than an internal wire.
export class ContainerLink extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'ContainerLink',
            z: 3,
            attrs: {
                line: {
                    stroke: '#0D9488',
                    strokeWidth: 2,
                    strokeDasharray: '6,3',
                    targetMarker: { d: 'M 8 4 0 0 8 -4 Z', fill: '#0D9488' },
                },
            },
        }, super.defaults);
    }
}
