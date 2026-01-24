import { mapLinkFromGraph } from '../cell/cell-utilities';
import type { dia } from '@joint/core';

describe('cell utilities', () => {
  let mockCell: dia.Cell;

  beforeEach(() => {
    mockCell = {
      id: 'mock-id',
      attributes: {
        size: { width: 100, height: 50 },
        position: { x: 10, y: 20 },
        data: { key: 'value' },
        type: 'mock-type',
        ports: { items: [] },
      },
      get: jest.fn((key) => {
        const mockData: Record<string, unknown> = {
          source: 'source-id',
          target: 'target-id',
          z: 1,
          markup: '<markup>',
          defaultLabel: 'default-label',
          ports: { items: [] },
        };
        return mockData[key];
      }),
    } as unknown as dia.Cell;
  });

  describe('linkFromGraph', () => {
    it('should extract link attributes correctly', () => {
      const link = mapLinkFromGraph(mockCell);
      expect(link).toMatchObject({
        id: 'mock-id',
        source: 'source-id',
        target: 'target-id',
        type: 'mock-type',
        z: 1,
        markup: '<markup>',
        defaultLabel: 'default-label',
        data: { key: 'value' },
        size: { width: 100, height: 50 },
        position: { x: 10, y: 20 },
        ports: { items: [] },
      });
    });
  });
});
