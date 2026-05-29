import { dia } from '@joint/core';
import { isPaperTarget, resolvePaper, resolvePaperId } from '../resolve-paper-target';

describe('resolve-paper-target', () => {
  describe('isPaperTarget', () => {
    it('is true for a string id', () => {
      expect(isPaperTarget('paper-id')).toBe(true);
    });

    it('is true for a dia.Paper instance', () => {
      expect(isPaperTarget(new dia.Paper({ width: 1, height: 1 }))).toBe(true);
    });

    it('is true for a RefObject', () => {
      expect(isPaperTarget({ current: null })).toBe(true);
    });

    it('is false for a handlers/options object or nullish value', () => {
      const nothing: unknown = undefined;
      expect(isPaperTarget({ onElementPointerClick: () => {} })).toBe(false);
      expect(isPaperTarget(nothing)).toBe(false);
    });
  });

  describe('resolvePaper', () => {
    it('returns null for string targets (id form unsupported here)', () => {
      expect(resolvePaper('some-id')).toBeNull();
    });

    it('returns the paper when target is a dia.Paper instance', () => {
      const paper = new dia.Paper({ width: 1, height: 1 });
      expect(resolvePaper(paper)).toBe(paper);
    });

    it('returns the ref current when target is a RefObject', () => {
      const paper = new dia.Paper({ width: 1, height: 1 });
      const ref: React.RefObject<dia.Paper | null> = { current: paper };
      expect(resolvePaper(ref)).toBe(paper);
    });

    it('returns null when ref current is null', () => {
      const ref: React.RefObject<dia.Paper | null> = { current: null };
      expect(resolvePaper(ref)).toBeNull();
    });
  });

  describe('resolvePaperId', () => {
    it('returns null for nullish target', () => {
      expect(resolvePaperId()).toBeNull();
    });

    it('returns the string itself when target is a string', () => {
      expect(resolvePaperId('paper-id')).toBe('paper-id');
    });

    it('returns the paper id when target is a dia.Paper instance', () => {
      const paper = new dia.Paper({ width: 1, height: 1 });
      (paper as unknown as { id: string }).id = 'paper-1';
      expect(resolvePaperId(paper)).toBe('paper-1');
    });

    it('returns the paper id when target is a RefObject with paper', () => {
      const paper = new dia.Paper({ width: 1, height: 1 });
      (paper as unknown as { id: string }).id = 'paper-2';
      const ref: React.RefObject<dia.Paper | null> = { current: paper };
      expect(resolvePaperId(ref)).toBe('paper-2');
    });
  });
});
