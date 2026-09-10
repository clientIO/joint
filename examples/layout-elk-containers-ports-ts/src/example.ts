import { dia } from '@joint/core';

// A fixed (non-random) system diagram: three containers grouping eight
// services that communicate over ports, including links that cross container
// boundaries. Every plain `example.Service` has exactly one 'in' and one
// 'out' port; the four "hub" services (Load Balancer, API Gateway, Auth
// Service, Logger) are `example.HubService` instead, with a custom number of
// ports - highlighted, and the only ones that opt into `positionPorts` so
// ELK orders their ports to minimize crossings (see `index.ts`).
export const graphJSON: dia.Graph.JSON = {
    cells: [
        // Containers
        {
            id: 'frontend',
            type: 'example.Container',
            attrs: { label: { text: 'Frontend' } },
            embeds: ['webui', 'mobileui', 'lb', 'gateway']
        },
        {
            id: 'backend',
            type: 'example.Container',
            attrs: { label: { text: 'Backend' } },
            embeds: ['auth', 'cache', 'db']
        },
        {
            id: 'observability',
            type: 'example.Container',
            attrs: { label: { text: 'Observability' } },
            embeds: ['logger']
        },

        // Frontend
        {
            id: 'webui',
            type: 'example.Service',
            parent: 'frontend',
            attrs: { body: { fill: '#F8FCDA' }, label: { text: 'Web UI' } }
        },
        {
            id: 'mobileui',
            type: 'example.Service',
            parent: 'frontend',
            attrs: { body: { fill: '#F8FCDA' }, label: { text: 'Mobile UI' } }
        },
        {
            id: 'lb',
            type: 'example.HubService',
            parent: 'frontend',
            size: { width: 130, height: 80 },
            attrs: { body: { fill: '#E3E9C2' }, label: { text: 'Load Balancer' } },
            ports: {
                items: [
                    { id: 'in1', group: 'in', attrs: { text: { text: 'in1' } } },
                    { id: 'in2', group: 'in', attrs: { text: { text: 'in2' } } },
                    { id: 'out', group: 'out', attrs: { text: { text: 'out' } } }
                ]
            }
        },
        {
            id: 'gateway',
            type: 'example.HubService',
            parent: 'frontend',
            size: { width: 130, height: 80 },
            attrs: { body: { fill: '#E3E9C2' }, label: { text: 'API Gateway' } },
            ports: {
                items: [
                    { id: 'in', group: 'in', attrs: { text: { text: 'in' } } },
                    { id: 'out1', group: 'out', attrs: { text: { text: 'out1' } } },
                    { id: 'out2', group: 'out', attrs: { text: { text: 'out2' } } }
                ]
            }
        },

        // Backend
        {
            id: 'auth',
            type: 'example.HubService',
            parent: 'backend',
            size: { width: 130, height: 80 },
            attrs: { body: { fill: '#F9FBB2' }, label: { text: 'Auth Service' } },
            ports: {
                items: [
                    { id: 'in', group: 'in', attrs: { text: { text: 'in' } } },
                    { id: 'out1', group: 'out', attrs: { text: { text: 'out1' } } },
                    { id: 'out2', group: 'out', attrs: { text: { text: 'out2' } } }
                ]
            }
        },
        {
            id: 'cache',
            type: 'example.Service',
            parent: 'backend',
            attrs: { body: { fill: '#F9FBB2' }, label: { text: 'Cache' } }
        },
        {
            id: 'db',
            type: 'example.Service',
            parent: 'backend',
            attrs: { body: { fill: '#C89F9C' }, label: { text: 'Database' } }
        },

        // Observability
        {
            id: 'logger',
            type: 'example.HubService',
            parent: 'observability',
            size: { width: 130, height: 80 },
            attrs: { body: { fill: '#D9D2E9' }, label: { text: 'Logger' } },
            ports: {
                items: [
                    { id: 'in1', group: 'in', attrs: { text: { text: 'in1' } } },
                    { id: 'in2', group: 'in', attrs: { text: { text: 'in2' } } }
                ]
            }
        },

        // Links
        {
            id: 'l1',
            type: 'example.InteractionLink',
            source: { id: 'webui', port: 'out' },
            target: { id: 'lb', port: 'in1' },
            labels: [{ attrs: { text: { text: 'request' } } }]
        },
        {
            id: 'l2',
            type: 'example.InteractionLink',
            source: { id: 'mobileui', port: 'out' },
            target: { id: 'lb', port: 'in2' },
            labels: [{ attrs: { text: { text: 'request' } } }]
        },
        {
            id: 'l3',
            type: 'example.InteractionLink',
            source: { id: 'lb', port: 'out' },
            target: { id: 'gateway', port: 'in' },
            labels: [{ attrs: { text: { text: 'route' } } }]
        },
        {
            id: 'l4',
            type: 'example.InteractionLink',
            source: { id: 'gateway', port: 'out1' },
            target: { id: 'auth', port: 'in' },
            labels: [{ attrs: { text: { text: 'authenticate' } } }]
        },
        {
            id: 'l5',
            type: 'example.InteractionLink',
            source: { id: 'gateway', port: 'out2' },
            target: { id: 'logger', port: 'in1' },
            labels: [{ attrs: { text: { text: 'log' } } }]
        },
        {
            id: 'l6',
            type: 'example.InteractionLink',
            source: { id: 'auth', port: 'out1' },
            target: { id: 'cache', port: 'in' },
            labels: [{ attrs: { text: { text: 'lookup' } } }]
        },
        {
            id: 'l7',
            type: 'example.InteractionLink',
            source: { id: 'auth', port: 'out2' },
            target: { id: 'logger', port: 'in2' },
            //labels: [{ attrs: { text: { text: 'log' } } }]
        },
        {
            id: 'l8',
            type: 'example.InteractionLink',
            source: { id: 'cache', port: 'out' },
            target: { id: 'db', port: 'in' },
            labels: [{ attrs: { text: { text: 'query' } } }]
        }
    ]
};
