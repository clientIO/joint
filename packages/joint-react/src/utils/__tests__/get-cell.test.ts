import { defaultMapLinkAttributesToData } from '../../state/data-mapping';
import type { dia } from '@joint/core';
import type { GraphToLinkOptions } from '../../state/graph-state-selectors';
import type { GraphLink } from '../../types/link-types';

describe('graph-state-selectors link mapping', () => {
  let mockCell: dia.Link;

  beforeEach(() => {
    mockCell = {
      id: 'mock-id',
      attributes: {
        data: { key: 'value' },
        type: 'mock-type',
      },
      get: jest.fn((key) => {
        const mockData: Record<string, unknown> = {
          source: 'source-id',
          target: 'target-id',
          z: 1,
          markup: '<markup>',
          defaultLabel: 'default-label',
        };
        return mockData[key];
      }),
    } as unknown as dia.Link;
  });

  describe('defaultMapLinkAttributesToData', () => {
    it('should extract link attributes correctly', () => {
      const link = defaultMapLinkAttributesToData({
        id: mockCell.id as string,
        cell: mockCell,
        graph: {} as dia.Graph,
      } as unknown as GraphToLinkOptions<GraphLink>);
      // id is no longer part of GraphLink - it's the Record key
      expect(link).toMatchObject({
        source: 'source-id',
        target: 'target-id',
        type: 'mock-type',
        z: 1,
        markup: '<markup>',
        defaultLabel: 'default-label',
        key: 'value', // data properties are spread to top level
      });
      expect(link).not.toHaveProperty('id');
    });
  });
});
