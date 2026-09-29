import { dia } from '@joint/core';

// A fixed (non-random) system diagram: three top-level containers, two of
// them with a nested container of their own, grouping eight services that
// communicate over ports - plus a couple of links that connect two
// containers directly, rather than a pair of ports, including one that
// crosses container boundaries. A recognizable, if simplified, web platform
// reference architecture: a client layer talking through an edge (load
// balancer + API gateway) to core services (auth, guarding a data layer of
// cache + database), with logs/metrics/analytics flowing to observability.
// Every plain `example.Service` has exactly one 'in' and one 'out' port; the
// four "hub" services (Load Balancer, API Gateway, Auth Service, Monitoring)
// are `example.HubService` instead, with a custom number of ports and ELK's
// `FIXED_SIDE` port constraint, so it can reorder them to minimize crossings
// (see `index.ts`).
export const graphJSON: dia.Graph.JSON = {
    cells: [
        // Containers
        {
            id: 'frontend',
            type: 'example.Container',
            attrs: { label: { text: 'Client Layer' } }
        },
        {
            id: 'edge',
            type: 'example.Container',
            parent: 'frontend',
            attrs: { label: { text: 'Edge' } }
        },
        {
            id: 'backend',
            type: 'example.Container',
            attrs: { label: { text: 'Core Services' } }
        },
        {
            id: 'storage',
            type: 'example.Container',
            parent: 'backend',
            attrs: { label: { text: 'Data Layer' } }
        },
        {
            id: 'observability',
            type: 'example.Container',
            attrs: { label: { text: 'Observability' } }
        },

        // Client Layer
        {
            id: 'webui',
            type: 'example.Service',
            parent: 'frontend',
            attrs: { label: { text: 'Web App' } }
        },
        {
            id: 'mobileui',
            type: 'example.Service',
            parent: 'frontend',
            attrs: { label: { text: 'Mobile App' } }
        },
        {
            id: 'lb',
            type: 'example.HubService',
            parent: 'edge',
            size: { width: 130, height: 80 },
            attrs: { label: { text: 'Load Balancer' } },
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
            parent: 'edge',
            size: { width: 130, height: 80 },
            attrs: { label: { text: 'API Gateway' } },
            ports: {
                items: [
                    { id: 'in', group: 'in', attrs: { text: { text: 'in' } } },
                    { id: 'out1', group: 'out', attrs: { text: { text: 'out1' } } },
                    { id: 'out2', group: 'out', attrs: { text: { text: 'out2' } } }
                ]
            }
        },

        // Core Services
        {
            id: 'auth',
            type: 'example.HubService',
            parent: 'backend',
            size: { width: 130, height: 80 },
            attrs: { label: { text: 'Auth Service' } },
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
            parent: 'storage',
            attrs: { label: { text: 'Redis Cache' } }
        },
        {
            id: 'db',
            type: 'example.Service',
            parent: 'storage',
            attrs: { label: { text: 'PostgreSQL' } }
        },

        // Observability
        {
            id: 'monitoring',
            type: 'example.HubService',
            parent: 'observability',
            size: { width: 130, height: 80 },
            attrs: { label: { text: 'Monitoring' } },
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
            target: { id: 'monitoring', port: 'in1' },
            labels: [{ attrs: { text: { text: 'metrics' } } }]
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
            target: { id: 'monitoring', port: 'in2' },
            labels: [{ attrs: { text: { text: 'logs' } } }]
        },
        {
            id: 'l8',
            type: 'example.InteractionLink',
            source: { id: 'cache', port: 'out' },
            target: { id: 'db', port: 'in' },
            labels: [{ attrs: { text: { text: 'query' } } }]
        },

        // Container-to-container links - connected to a `example.Container` cell
        // itself rather than to one of its ports, aggregating what the individual
        // service-to-service links above already carry.
        {
            id: 'l9',
            type: 'example.InteractionLink',
            source: { id: 'backend' },
            target: { id: 'observability' },
            // Overrides `InteractionLink.defaultLabel`'s `inline` (own value wins -
            // see `Link#labels`) - floated beside the edge instead of centered directly on
            // it, so it doesn't obscure a long aggregate link's whole path.
            labels: [{ attrs: { text: { text: 'metrics' } } }]
        },
        {
            id: 'l10',
            type: 'example.InteractionLink',
            source: { id: 'frontend' },
            target: { id: 'observability' },
            labels: [{ attrs: { text: { text: 'analytics' } } }]
        }
    ]
};
