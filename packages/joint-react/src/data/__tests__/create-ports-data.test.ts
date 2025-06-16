import { createPortsData, type PortElementsCacheEntry } from '../create-ports-data';

describe('create-ports-data', () => {
  it('should handle createPortsData', () => {
    const portsData = createPortsData();
    expect(portsData).toHaveProperty('set');
    expect(portsData).toHaveProperty('get');
    expect(portsData).toHaveProperty('clear');

    const elementCache: Record<string, PortElementsCacheEntry> = {
      port1: {
        portElement: {} as never,
        portLabelElement: null,
        portSelectors: {
          'react-port-portal': {} as never,
        },
        portLabelSelectors: {},
        portContentElement: {} as never,
        portContentSelectors: {},
      },
    };
    const cellId = 'cell1';
    portsData.set(cellId, elementCache);
    expect(portsData.get(cellId, 'port1')).toBeDefined();
    expect(portsData.get(cellId, 'port2')).toBeUndefined();
    expect(portsData.get('cell2', 'port1')).toBeUndefined();
  });
});
