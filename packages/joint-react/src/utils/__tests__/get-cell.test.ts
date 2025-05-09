import { getCell, getElement, getLink } from '../cell/get-cell';
import type { dia } from '@joint/core';

describe('getCell', () => {
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
      isElement: jest.fn(),
      isLink: jest.fn(),
      get: jest.fn((key) => {
        const mockData = {
          source: 'source-id',
          target: 'target-id',
          z: 1,
          markup: '<markup>',
          defaultLabel: 'default-label',
          ports: { items: [] },
          size: { width: 100, height: 50 },
          position: { x: 10, y: 20 },
          data: { key: 'value' },
        };
        // @ts-expect-error its just mock
        return mockData[key];
      }),
    } as unknown as dia.Cell;
  });

  describe('getElement', () => {
    it('should extract element attributes correctly', () => {
      const element = getElement(mockCell);
      expect(element).toEqual({
        id: 'mock-id',
        isElement: true,
        isLink: false,
        data: { key: 'value' },
        type: 'mock-type',
        ports: { items: [] },
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });
  });

  describe('getLink', () => {
    it('should extract link attributes correctly', () => {
      const link = getLink(mockCell);
      expect(link).toEqual({
        id: 'mock-id',
        isElement: false,
        isLink: true,
        source: 'source-id',
        target: 'target-id',
        type: 'mock-type',
        z: 1,
        markup: '<markup>',
        defaultLabel: 'default-label',
        ports: { items: [] },
        size: { width: 100, height: 50 },
        position: { x: 10, y: 20 },
        data: { key: 'value' },
      });
    });
  });

  describe('getCell', () => {
    it('should return an element when the cell is an element', () => {
      (mockCell.isElement as unknown as jest.Mock).mockReturnValue(true);
      const result = getCell(mockCell);
      expect(result).toEqual(expect.objectContaining({ isElement: true, isLink: false }));
    });

    it('should return a link when the cell is a link', () => {
      (mockCell.isElement as unknown as jest.Mock).mockReturnValue(false);
      const result = getCell(mockCell);
      expect(result).toEqual(expect.objectContaining({ isElement: false, isLink: true }));
    });
  });
});
