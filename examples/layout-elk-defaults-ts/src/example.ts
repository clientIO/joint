import { dia } from '@joint/core';

// A small, fixed system diagram exercising every connectivity/labeling shape
// `@joint/layout-elk` lays out with no custom export/import callbacks at all:
// two containers grouping services that talk over ports (port <-> port),
// a port connected straight to a portless element (port <-> element), and a
// link between the two containers themselves (element <-> element).
export const graphJSON: dia.Graph.JSON = {
    cells: [
        // Containers
        {
            id: 'web',
            type: 'example.Container',
            attrs: { label: { text: 'Web Tier' } }
        },
        {
            id: 'data',
            type: 'example.Container',
            attrs: { label: { text: 'Data Tier' } }
        },

        // Web Tier
        {
            id: 'webapp',
            type: 'example.Service',
            parent: 'web',
            attrs: { label: { text: 'Web App' } },
            ports: {
                items: [
                    { id: 'out', group: 'out', attrs: { text: { text: 'out' } } }
                ]
            }
        },
        {
            id: 'mobileapp',
            type: 'example.Service',
            parent: 'web',
            attrs: { label: { text: 'Mobile App' } },
            ports: {
                items: [
                    { id: 'out', group: 'out', attrs: { text: { text: 'out' } } }
                ]
            }
        },

        // Data Tier
        {
            id: 'api',
            type: 'example.Service',
            parent: 'data',
            // Taller than the default - two ports a side need enough vertical room
            // between them that a port's own label (offset just above it) doesn't
            // collide with its neighbor.
            size: { width: 130, height: 90 },
            attrs: { label: { text: 'API Service' } },
            ports: {
                items: [
                    { id: 'in1', group: 'in', attrs: { text: { text: 'in1' } } },
                    { id: 'in2', group: 'in', attrs: { text: { text: 'in2' } } },
                    { id: 'out1', group: 'out', attrs: { text: { text: 'out1' } } },
                    { id: 'out2', group: 'out', attrs: { text: { text: 'out2' } } }
                ]
            }
        },
        {
            id: 'db',
            type: 'example.Service',
            parent: 'data',
            attrs: { label: { text: 'Database' } },
            ports: {
                items: [
                    { id: 'in', group: 'in', attrs: { text: { text: 'in' } } }
                ]
            }
        },

        // A standalone, portless element - the target of a port-to-element link.
        {
            id: 'monitoring',
            type: 'example.Service',
            attrs: { label: { text: 'Monitoring' } }
        },

        // Links between ports
        {
            id: 'l1',
            type: 'example.InteractionLink',
            source: { id: 'webapp', port: 'out' },
            target: { id: 'api', port: 'in1' },
            labels: [{ attrs: { text: { text: 'request' } } }]
        },
        {
            id: 'l2',
            type: 'example.InteractionLink',
            source: { id: 'mobileapp', port: 'out' },
            target: { id: 'api', port: 'in2' },
            labels: [{ attrs: { text: { text: 'request' } } }]
        },
        {
            id: 'l3',
            type: 'example.InteractionLink',
            source: { id: 'api', port: 'out1' },
            target: { id: 'db', port: 'in' },
            labels: [{ attrs: { text: { text: 'query' } } }]
        },

        // A link from a port straight to a portless element.
        {
            id: 'l4',
            type: 'example.InteractionLink',
            source: { id: 'api', port: 'out2' },
            target: { id: 'monitoring' },
            labels: [{ attrs: { text: { text: 'metrics' } } }]
        },

        // A link between the two containers themselves - neither end is a port.
        {
            id: 'l5',
            type: 'example.InteractionLink',
            source: { id: 'web' },
            target: { id: 'data' },
            labels: [{ attrs: { text: { text: 'traffic' } } }]
        }
    ]
};
