import { dia } from '@joint/core';

// A Ptolemy II dataflow model - actors connected through their input and output
// ports. Three of the actors are composites, holding a sub-model of their own -
// their ports connect the outside of the composite to the actors inside it.
//
// Only the structure is given - every position, the size of each composite, and
// the route of each link are computed by ELK (see `index.ts`). Each port's
// group is the side of its actor it sits on, and the order of `ports.items` is
// its order along that side.
export const graphJSON: dia.Graph.JSON = {
    cells: [
        {
            id: 'n1',
            type: 'example.Actor',
            size: { width: 55, height: 40 },
            attrs: { label: { text: 'DatagramReader' } },
            ports: { items: [{ id: 'p1', group: 'east' }, { id: 'p2', group: 'east' }, { id: 'p3', group: 'east' }, { id: 'p4', group: 'west' }] }
        },
        {
            id: 'n2',
            type: 'example.Actor',
            size: { width: 55, height: 40 },
            attrs: { label: { text: 'Ramp' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'west' }, { id: 'p3', group: 'east' }] }
        },
        {
            id: 'n3',
            type: 'example.Actor',
            size: { width: 55, height: 40 },
            attrs: { label: { text: 'QueueControl' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'west' }, { id: 'p3', group: 'west' }, { id: 'p4', group: 'west' }, { id: 'p5', group: 'east' }, { id: 'p6', group: 'east' }, { id: 'p7', group: 'east' }] }
        },
        {
            id: 'n4',
            type: 'example.Actor',
            size: { width: 35, height: 27 },
            attrs: { label: { text: 'Display' } },
            ports: { items: [{ id: 'p1', group: 'west' }] }
        },
        {
            id: 'n5',
            type: 'example.Composite',
            attrs: { label: { text: 'Interface - fast' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'east' }] }
        },
        {
            id: 'n6',
            type: 'example.Actor',
            parent: 'n5',
            size: { width: 50, height: 35 },
            attrs: { label: { text: 'Sleep' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'east' }, { id: 'p3', group: 'south' }] }
        },
        {
            id: 'n7',
            type: 'example.Composite',
            attrs: { label: { text: 'Interface - slow' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'east' }] }
        },
        {
            id: 'n8',
            type: 'example.Actor',
            parent: 'n7',
            size: { width: 50, height: 35 },
            attrs: { label: { text: 'Sleep' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'east' }, { id: 'p3', group: 'south' }] }
        },
        {
            id: 'n9',
            type: 'example.Actor',
            size: { width: 55, height: 35 },
            attrs: { label: { text: 'Counter - q1' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'west' }, { id: 'p3', group: 'east' }] }
        },
        {
            id: 'n10',
            type: 'example.Actor',
            size: { width: 55, height: 35 },
            attrs: { label: { text: 'Counter - q2' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'west' }, { id: 'p3', group: 'east' }] }
        },
        {
            id: 'n11',
            type: 'example.Composite',
            attrs: { label: { text: 'channel1' } },
            ports: { items: [{ id: 'p1', group: 'west' }] }
        },
        {
            id: 'n12',
            type: 'example.Actor',
            parent: 'n11',
            size: { width: 55, height: 35 },
            attrs: { label: { text: 'Counter' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'west' }, { id: 'p3', group: 'east' }] }
        },
        {
            id: 'n13',
            type: 'example.Actor',
            parent: 'n11',
            size: { width: 10, height: 40 },
            attrs: { label: { text: 'RecordAssembler' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'west' }, { id: 'p3', group: 'east' }] }
        },
        {
            id: 'n14',
            type: 'example.Actor',
            parent: 'n11',
            size: { width: 35, height: 27 },
            attrs: { label: { text: 'Display' } },
            ports: { items: [{ id: 'p1', group: 'west' }] }
        },
        {
            id: 'n15',
            type: 'example.Composite',
            attrs: { label: { text: 'channel2' } },
            ports: { items: [{ id: 'p1', group: 'west' }] }
        },
        {
            id: 'n16',
            type: 'example.Actor',
            parent: 'n15',
            size: { width: 55, height: 35 },
            attrs: { label: { text: 'Counter' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'west' }, { id: 'p3', group: 'east' }] }
        },
        {
            id: 'n17',
            type: 'example.Actor',
            parent: 'n15',
            size: { width: 10, height: 40 },
            attrs: { label: { text: 'RecordAssembler' } },
            ports: { items: [{ id: 'p1', group: 'west' }, { id: 'p2', group: 'west' }, { id: 'p3', group: 'east' }] }
        },
        {
            id: 'n18',
            type: 'example.Actor',
            parent: 'n15',
            size: { width: 35, height: 27 },
            attrs: { label: { text: 'Display' } },
            ports: { items: [{ id: 'p1', group: 'west' }] }
        },
        {
            id: 'n19',
            type: 'example.Actor',
            size: { width: 55, height: 40 },
            attrs: { label: { text: 'MonitorValue - q1 length' } },
            ports: { items: [{ id: 'p1', group: 'west' }] }
        },
        {
            id: 'n20',
            type: 'example.Actor',
            size: { width: 55, height: 40 },
            attrs: { label: { text: 'MonitorValue - q2 length' } },
            ports: { items: [{ id: 'p1', group: 'west' }] }
        },
        { id: 'e0', type: 'example.Edge', source: { id: 'n1', port: 'p3' }, target: { id: 'n2', port: 'p2' } },
        { id: 'e1', type: 'example.Edge', source: { id: 'n2', port: 'p3' }, target: { id: 'n3', port: 'p2' } },
        { id: 'e2', type: 'example.Edge', source: { id: 'n3', port: 'p5' }, target: { id: 'n4', port: 'p1' } },
        { id: 'e3', type: 'example.Edge', source: { id: 'n3', port: 'p6' }, target: { id: 'n5', port: 'p1' } },
        { id: 'e4', type: 'example.Edge', source: { id: 'n3', port: 'p7' }, target: { id: 'n7', port: 'p1' } },
        { id: 'e5', type: 'example.Edge', source: { id: 'n3', port: 'p6' }, target: { id: 'n9', port: 'p2' } },
        { id: 'e6', type: 'example.Edge', source: { id: 'n5', port: 'p2' }, target: { id: 'n9', port: 'p1' } },
        { id: 'e7', type: 'example.Edge', source: { id: 'n3', port: 'p7' }, target: { id: 'n10', port: 'p2' } },
        { id: 'e8', type: 'example.Edge', source: { id: 'n7', port: 'p2' }, target: { id: 'n10', port: 'p1' } },
        { id: 'e9', type: 'example.Edge', source: { id: 'n5', port: 'p2' }, target: { id: 'n11', port: 'p1' } },
        { id: 'e10', type: 'example.Edge', source: { id: 'n7', port: 'p2' }, target: { id: 'n15', port: 'p1' } },
        { id: 'e11', type: 'example.Edge', source: { id: 'n9', port: 'p3' }, target: { id: 'n19', port: 'p1' } },
        { id: 'e12', type: 'example.Edge', source: { id: 'n19', port: 'p1' }, target: { id: 'n3', port: 'p3' } },
        { id: 'e13', type: 'example.Edge', source: { id: 'n10', port: 'p3' }, target: { id: 'n20', port: 'p1' } },
        { id: 'e14', type: 'example.Edge', source: { id: 'n20', port: 'p1' }, target: { id: 'n3', port: 'p1' } },
        { id: 'e15', type: 'example.Edge', source: { id: 'n5', port: 'p1' }, target: { id: 'n6', port: 'p1' } },
        { id: 'e16', type: 'example.Edge', source: { id: 'n6', port: 'p2' }, target: { id: 'n5', port: 'p2' } },
        { id: 'e17', type: 'example.Edge', source: { id: 'n7', port: 'p1' }, target: { id: 'n8', port: 'p1' } },
        { id: 'e18', type: 'example.Edge', source: { id: 'n8', port: 'p2' }, target: { id: 'n7', port: 'p2' } },
        { id: 'e19', type: 'example.Edge', source: { id: 'n11', port: 'p1' }, target: { id: 'n12', port: 'p2' } },
        { id: 'e20', type: 'example.Edge', source: { id: 'n12', port: 'p3' }, target: { id: 'n13', port: 'p1' } },
        { id: 'e21', type: 'example.Edge', source: { id: 'n11', port: 'p1' }, target: { id: 'n13', port: 'p2' } },
        { id: 'e22', type: 'example.Edge', source: { id: 'n13', port: 'p3' }, target: { id: 'n14', port: 'p1' } },
        { id: 'e23', type: 'example.Edge', source: { id: 'n15', port: 'p1' }, target: { id: 'n16', port: 'p2' } },
        { id: 'e24', type: 'example.Edge', source: { id: 'n16', port: 'p3' }, target: { id: 'n17', port: 'p1' } },
        { id: 'e25', type: 'example.Edge', source: { id: 'n15', port: 'p1' }, target: { id: 'n17', port: 'p2' } },
        { id: 'e26', type: 'example.Edge', source: { id: 'n17', port: 'p3' }, target: { id: 'n18', port: 'p1' } }
    ]
};
