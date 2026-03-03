import { appendOutputPort, createNextOutputPort } from './port-utilities';

describe('user-flow port utils', () => {
  it('appends next output port id from highest existing numeric id', () => {
    const next = createNextOutputPort([
      { id: '1', label: 'Port 1' },
      { id: '3', label: 'Port 3' },
    ]);

    expect(next.id).toBe('4');
    expect(next.label).toBe('Port 4');
  });

  it('appends output port to node', () => {
    const updated = appendOutputPort({
      outputPorts: [
        { id: '1', label: 'Port 1' },
        { id: '2', label: 'Port 2' },
      ],
    });

    expect(updated.outputPorts).toHaveLength(3);
    expect(updated.outputPorts[2]).toEqual({ id: '3', label: 'Port 3' });
  });

});
