import { dia } from '@joint/core';
import { OPTIONAL, resolvePaper, resolvePaperId } from '../index';
import type { PaperTarget } from '../index';

describe('types/index runtime exports', () => {
  describe('OPTIONAL sentinel', () => {
    it('is a frozen-style readonly object with optional: true', () => {
      expect(OPTIONAL).toEqual({ optional: true });
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

    it('returns null for the OPTIONAL sentinel', () => {
      expect(resolvePaper(OPTIONAL as PaperTarget)).toBeNull();
    });
  });

  describe('resolvePaperId', () => {
    it('returns null for nullish target', () => {
      expect(resolvePaperId()).toBeNull();
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

    it('returns null when target cannot be resolved (e.g. OPTIONAL)', () => {
      expect(resolvePaperId(OPTIONAL as PaperTarget)).toBeNull();
    });

    it('returns the paper id when target is a RefObject with paper', () => {
      const paper = new dia.Paper({ width: 1, height: 1 });
      (paper as unknown as { id: string }).id = 'paper-2';
      const ref: React.RefObject<dia.Paper | null> = { current: paper };
      expect(resolvePaperId(ref)).toBe('paper-2');
    });
  });
});
