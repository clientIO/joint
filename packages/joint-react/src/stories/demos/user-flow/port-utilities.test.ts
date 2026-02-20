import { appendOutputPort, createNextOutputPort, createPorts } from './port-utilities';

describe('user-flow port utils', () => {
  it('creates hidden native output ports with higher z for reliable hit testing', () => {
    const ports = createPorts([
      { id: '1', label: 'Port 1' },
      { id: '2', label: 'Port 2' },
    ]);

    const items = ports?.items ?? [];
    expect(items).toHaveLength(3);
    expect(items[0]?.id).toBe('in');
    expect(items[0]?.z).toBe(100);
    expect(items[1]?.z).toBe(100);
    expect(items[2]?.z).toBe(100);
    expect((items[2]?.args as { x?: number })?.x).toBeGreaterThan((items[1]?.args as { x?: number })?.x ?? 0);
  });

  it('appends next output port id from highest existing numeric id', () => {
    const next = createNextOutputPort([
      { id: '1', label: 'Port 1' },
      { id: '3', label: 'Port 3' },
    ]);

    expect(next.id).toBe('4');
    expect(next.label).toBe('Port 4');
  });

  it('appends output port and regenerates native ports data', () => {
    const updated = appendOutputPort({
      id: 'n-1',
      title: 'Node',
      description: 'Description',
      nodeType: 'user-action',
      x: 10,
      y: 20,
      outputPorts: [
        { id: '1', label: 'Port 1' },
        { id: '2', label: 'Port 2' },
      ],
      ports: createPorts([
        { id: '1', label: 'Port 1' },
        { id: '2', label: 'Port 2' },
      ]),
    });

    expect(updated.outputPorts).toHaveLength(3);
    expect(updated.outputPorts[2]).toEqual({ id: '3', label: 'Port 3' });
    expect(updated.ports?.items).toHaveLength(4);
    expect(updated.ports?.items?.[3]?.id).toBe('3');
  });
});
