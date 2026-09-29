import { dia } from '@joint/core';

// A fixed (non-random) login flowchart - two genuine cycles (a failed-validation
// retry back to "Enter Credentials", and a failed-session retry back to "Check
// Account Status"), "Generate Session" starting out with two 'out' ports of its
// own (success/error) - a plain step can have more than one outgoing path too,
// not just a `Decision` - and "Active?" starting out with three siblings
// ("Account Locked"/"Generate Session"/"Account Suspended") sharing its layer,
// to demonstrate reordering more than a plain pair. Try either "+" button (any
// node) or clicking a port (any 'out' one) to grow the flowchart further, or
// drag a link between two still-unconnected ports to wire two existing steps
// together - see `index.ts`.
export const graphJSON: dia.Graph.JSON = {
    cells: [
        {
            id: 'start',
            type: 'flowchart.Terminal',
            attrs: { label: { text: 'Start' } },
            ports: { items: [{ id: 'out', group: 'out' }] }
        },
        {
            id: 'enterCredentials',
            type: 'flowchart.Process',
            attrs: { label: { text: 'Enter Credentials' } },
            ports: { items: [{ id: 'in', group: 'in' }, { id: 'out', group: 'out' }] }
        },
        {
            id: 'validateCredentials',
            type: 'flowchart.Decision',
            attrs: { label: { text: 'Valid?' } },
            ports: {
                items: [
                    { id: 'in', group: 'in' },
                    { id: 'valid', group: 'out' },
                    { id: 'invalid', group: 'out' }
                ]
            }
        },
        {
            id: 'showError',
            type: 'flowchart.Process',
            attrs: { label: { text: 'Show Error' } },
            ports: { items: [{ id: 'in', group: 'in' }, { id: 'out', group: 'out' }] }
        },
        {
            id: 'checkAccountStatus',
            type: 'flowchart.Decision',
            attrs: { label: { text: 'Active?' } },
            ports: {
                items: [
                    { id: 'in', group: 'in' },
                    { id: 'active', group: 'out' },
                    { id: 'locked', group: 'out' },
                    { id: 'suspended', group: 'out' }
                ]
            }
        },
        {
            id: 'showLockedMessage',
            type: 'flowchart.Process',
            attrs: { label: { text: 'Account Locked' } },
            ports: { items: [{ id: 'in', group: 'in' }, { id: 'out', group: 'out' }] }
        },
        {
            id: 'showSuspendedMessage',
            type: 'flowchart.Process',
            attrs: { label: { text: 'Account Suspended' } },
            ports: { items: [{ id: 'in', group: 'in' }, { id: 'out', group: 'out' }] }
        },
        {
            id: 'generateSession',
            type: 'flowchart.Process',
            attrs: { label: { text: 'Generate Session' } },
            ports: {
                items: [
                    { id: 'in', group: 'in' },
                    { id: 'success', group: 'out' },
                    { id: 'error', group: 'out' }
                ]
            }
        },
        {
            id: 'sessionError',
            type: 'flowchart.Process',
            attrs: { label: { text: 'Session Error' } },
            ports: { items: [{ id: 'in', group: 'in' }, { id: 'out', group: 'out' }] }
        },
        {
            id: 'grantAccess',
            type: 'flowchart.Process',
            attrs: { label: { text: 'Grant Access' } },
            ports: { items: [{ id: 'in', group: 'in' }, { id: 'out', group: 'out' }] }
        },
        {
            id: 'end',
            type: 'flowchart.Terminal',
            attrs: { label: { text: 'End' } },
            ports: { items: [{ id: 'in', group: 'in' }] }
        },

        // Links
        { id: 'l1', type: 'flowchart.FlowLink', source: { id: 'start', port: 'out' }, target: { id: 'enterCredentials', port: 'in' } },
        { id: 'l2', type: 'flowchart.FlowLink', source: { id: 'enterCredentials', port: 'out' }, target: { id: 'validateCredentials', port: 'in' } },
        { id: 'l3', type: 'flowchart.FlowLink', source: { id: 'validateCredentials', port: 'invalid' }, target: { id: 'showError', port: 'in' }, labels: [{ attrs: { text: { text: 'Invalid' } } }] },
        { id: 'l4', type: 'flowchart.FlowLink', source: { id: 'validateCredentials', port: 'valid' }, target: { id: 'checkAccountStatus', port: 'in' }, labels: [{ attrs: { text: { text: 'Valid' } } }] },
        // Cycle 1: back up to "Enter Credentials" for another attempt.
        { id: 'l5', type: 'flowchart.FlowLink', source: { id: 'showError', port: 'out' }, target: { id: 'enterCredentials', port: 'in' } },
        { id: 'l6', type: 'flowchart.FlowLink', source: { id: 'checkAccountStatus', port: 'locked' }, target: { id: 'showLockedMessage', port: 'in' }, labels: [{ attrs: { text: { text: 'Locked' } } }] },
        { id: 'l7', type: 'flowchart.FlowLink', source: { id: 'checkAccountStatus', port: 'active' }, target: { id: 'generateSession', port: 'in' }, labels: [{ attrs: { text: { text: 'Active' } } }] },
        // A third sibling alongside "Account Locked"/"Generate Session" - all three share
        // "Active?" as their layer (see `index.ts`'s sibling-scoped drag-to-reorder).
        { id: 'l13', type: 'flowchart.FlowLink', source: { id: 'checkAccountStatus', port: 'suspended' }, target: { id: 'showSuspendedMessage', port: 'in' }, labels: [{ attrs: { text: { text: 'Suspended' } } }] },
        { id: 'l8', type: 'flowchart.FlowLink', source: { id: 'showLockedMessage', port: 'out' }, target: { id: 'end', port: 'in' } },
        { id: 'l14', type: 'flowchart.FlowLink', source: { id: 'showSuspendedMessage', port: 'out' }, target: { id: 'end', port: 'in' } },
        { id: 'l9', type: 'flowchart.FlowLink', source: { id: 'generateSession', port: 'success' }, target: { id: 'grantAccess', port: 'in' }, labels: [{ attrs: { text: { text: 'Success' } } }] },
        { id: 'l10', type: 'flowchart.FlowLink', source: { id: 'generateSession', port: 'error' }, target: { id: 'sessionError', port: 'in' }, labels: [{ attrs: { text: { text: 'Error' } } }] },
        // Cycle 2: back up to re-check the account before retrying.
        { id: 'l11', type: 'flowchart.FlowLink', source: { id: 'sessionError', port: 'out' }, target: { id: 'checkAccountStatus', port: 'in' } },
        { id: 'l12', type: 'flowchart.FlowLink', source: { id: 'grantAccess', port: 'out' }, target: { id: 'end', port: 'in' } }
    ]
};
