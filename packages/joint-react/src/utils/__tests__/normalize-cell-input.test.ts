import { shapes } from '@joint/core';
import { normalizeCellInput, resolveCellRef } from '../normalize-cell-input';
import { ELEMENT_MODEL_TYPE, ElementModel } from '../../models/element-model';
import { LINK_MODEL_TYPE, LinkModel } from '../../models/link-model';
import type { CellRecord, ElementRecord, LinkRecord } from '../../types/cell.types';

describe('normalizeCellInput', () => {
  describe('plain records pass through unchanged', () => {
    it('returns an element record as-is', () => {
      const record: ElementRecord = {
        id: 'e1',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        data: {},
      };
      expect(normalizeCellInput(record)).toBe(record);
    });

    it('returns a link record as-is', () => {
      const record: LinkRecord = {
        id: 'l1',
        type: LINK_MODEL_TYPE,
        source: { id: 'a' },
        target: { id: 'b' },
        data: {},
      };
      expect(normalizeCellInput(record)).toBe(record);
    });
  });

  describe('dia.Cell instances are converted to records', () => {
    it('converts a dia.Element to an element record', () => {
      const element = new ElementModel({
        id: 'e1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        data: { label: 'hello' },
      });
      const record = normalizeCellInput(element);
      expect(record).not.toBe(element);
      expect(record.id).toBe('e1');
      expect(record.type).toBe(ELEMENT_MODEL_TYPE);
      expect((record as ElementRecord).position).toEqual({ x: 10, y: 20 });
      expect((record as ElementRecord).size).toEqual({ width: 100, height: 50 });
      expect(record.data).toEqual({ label: 'hello' });
    });

    it('converts a dia.Link to a link record', () => {
      const link = new LinkModel({
        id: 'l1',
        source: { id: 'a' },
        target: { id: 'b' },
        data: { weight: 5 },
      });
      const record = normalizeCellInput(link);
      expect(record).not.toBe(link);
      expect(record.id).toBe('l1');
      expect(record.type).toBe(LINK_MODEL_TYPE);
      expect((record as LinkRecord).source).toEqual({ id: 'a' });
      expect((record as LinkRecord).target).toEqual({ id: 'b' });
      expect(record.data).toEqual({ weight: 5 });
    });

    it('converts a shapes.standard.Rectangle', () => {
      const rect = new shapes.standard.Rectangle({
        id: 'r1',
        position: { x: 5, y: 10 },
        size: { width: 200, height: 100 },
      });
      const record = normalizeCellInput(rect);
      expect(record.id).toBe('r1');
      expect(record.type).toBe('standard.Rectangle');
      expect((record as CellRecord).position).toEqual({ x: 5, y: 10 });
      expect((record as CellRecord).size).toEqual({ width: 200, height: 100 });
    });

    it('converts a shapes.standard.Link', () => {
      const link = new shapes.standard.Link({
        id: 'sl1',
        source: { id: 'a' },
        target: { id: 'b' },
      });
      const record = normalizeCellInput(link);
      expect(record.id).toBe('sl1');
      expect(record.type).toBe('standard.Link');
    });
  });
});

describe('resolveCellRef', () => {
  it('returns a string id as-is', () => {
    expect(resolveCellRef('my-id')).toBe('my-id');
  });

  it('extracts id from a dia.Cell instance', () => {
    const element = new ElementModel({ id: 'el-ref' });
    expect(resolveCellRef(element)).toBe('el-ref');
  });

  it('extracts id from shapes.standard.Rectangle', () => {
    const rect = new shapes.standard.Rectangle({ id: 'rect-ref' });
    expect(resolveCellRef(rect)).toBe('rect-ref');
  });
});
