import { dia } from '@joint/core';
import {
  clearConnectedLinkViews,
  executeClearViewForCell,
  mergeClearViewValidators,
  shouldClearLink,
  type ClearViewCacheEntry,
} from '../clear-view';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

interface MockLinkView {
  _sourceMagnet: SVGElement | null;
  _targetMagnet: SVGElement | null;
  requestConnectionUpdate: jest.Mock;
}

function createMockLinkView(): MockLinkView {
  return {
    _sourceMagnet: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
    _targetMagnet: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
    requestConnectionUpdate: jest.fn(),
  };
}

describe('mergeClearViewValidators', () => {
  it('returns incoming when there is no existing entry', () => {
    const incoming: ClearViewCacheEntry = { onValidateLink: () => true };
    const result = mergeClearViewValidators(undefined, incoming);
    expect(result).toBe(incoming);
  });

  it('takes precedence with no validator (clear all)', () => {
    const existing: ClearViewCacheEntry = { onValidateLink: () => true };
    const incoming: ClearViewCacheEntry = {};
    const result = mergeClearViewValidators(existing, incoming);
    expect(result.onValidateLink).toBeUndefined();
  });

  it('creates a union when both have validators', () => {
    const existingValidator = jest.fn().mockReturnValue(false);
    const newValidator = jest.fn().mockReturnValue(true);
    const result = mergeClearViewValidators(
      { onValidateLink: existingValidator },
      { onValidateLink: newValidator }
    );
    expect(typeof result.onValidateLink).toBe('function');
    const link = {} as dia.Link;
    expect(result.onValidateLink!(link)).toBe(true);
    expect(existingValidator).toHaveBeenCalledWith(link);
    expect(newValidator).toHaveBeenCalledWith(link);
  });

  it('union short-circuits when existing returns true', () => {
    const existingValidator = jest.fn().mockReturnValue(true);
    const newValidator = jest.fn().mockReturnValue(false);
    const result = mergeClearViewValidators(
      { onValidateLink: existingValidator },
      { onValidateLink: newValidator }
    );
    const link = {} as dia.Link;
    expect(result.onValidateLink!(link)).toBe(true);
    expect(newValidator).not.toHaveBeenCalled();
  });

  it('keeps the existing "clear all" semantics when existing has no validator', () => {
    const existing: ClearViewCacheEntry = {};
    const incoming: ClearViewCacheEntry = { onValidateLink: () => true };
    const result = mergeClearViewValidators(existing, incoming);
    expect(result).toBe(existing);
    expect(result.onValidateLink).toBeUndefined();
  });
});

function makeLink(sourceId: string, targetId: string): dia.Link {
  return new dia.Link({
    type: 'standard.Link',
    source: { id: sourceId },
    target: { id: targetId },
  });
}

describe('shouldClearLink', () => {

  it('returns true when source matches', () => {
    const link = makeLink('a', 'b');
    expect(shouldClearLink(link, 'a')).toBe(true);
  });

  it('returns true when target matches', () => {
    const link = makeLink('a', 'b');
    expect(shouldClearLink(link, 'b')).toBe(true);
  });

  it('returns false when neither end matches', () => {
    const link = makeLink('a', 'b');
    expect(shouldClearLink(link, 'c')).toBe(false);
  });

  it('returns false when validator rejects link', () => {
    const link = makeLink('a', 'b');
    const validator = jest.fn().mockReturnValue(false);
    expect(shouldClearLink(link, 'a', validator)).toBe(false);
    expect(validator).toHaveBeenCalledWith(link);
  });

  it('returns true when validator accepts link', () => {
    const link = makeLink('a', 'b');
    const validator = jest.fn().mockReturnValue(true);
    expect(shouldClearLink(link, 'a', validator)).toBe(true);
  });
});

describe('clearConnectedLinkViews', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = createGraph();
  });

  it('returns an empty change map when the cell is missing', () => {
    const paper = { findViewByModel: jest.fn() } as unknown as dia.Paper;
    const result = clearConnectedLinkViews(paper, graph, 'unknown');
    expect(result.size).toBe(0);
  });

  it('skips links when the validator excludes them', () => {
    graph.addCell({
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    graph.addCell({
      id: 'b',
      type: 'element',
      position: { x: 50, y: 0 },
      size: { width: 10, height: 10 },
    });
    graph.addCell({
      id: 'l1',
      type: 'standard.Link',
      source: { id: 'a' },
      target: { id: 'b' },
    });

    const paper = {
      findViewByModel: jest.fn(),
    } as unknown as dia.Paper;

    const onValidateLink = jest.fn().mockReturnValue(false);
    const result = clearConnectedLinkViews(paper, graph, 'a', onValidateLink);
    expect(result.size).toBe(0);
    expect(onValidateLink).toHaveBeenCalled();
  });

  it('skips links with no view in the paper', () => {
    graph.addCell({
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    graph.addCell({
      id: 'b',
      type: 'element',
      position: { x: 50, y: 0 },
      size: { width: 10, height: 10 },
    });
    const link = new dia.Link({
      id: 'l1',
      type: 'standard.Link',
      source: { id: 'a' },
      target: { id: 'b' },
    });
    graph.addCell(link);

    // Override `findView` to simulate the no-view-registered case.
    link.findView = jest.fn(() => undefined as unknown as dia.LinkView) as unknown as typeof link.findView;

    const paper = {
      findViewByModel: jest.fn(),
    } as unknown as dia.Paper;

    const result = clearConnectedLinkViews(paper, graph, 'a');
    expect(result.size).toBe(0);
  });

  it('records pending change and clears magnets when a view exists', () => {
    graph.addCell({
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    graph.addCell({
      id: 'b',
      type: 'element',
      position: { x: 50, y: 0 },
      size: { width: 10, height: 10 },
    });
    const link = new dia.Link({
      id: 'l1',
      type: 'standard.Link',
      source: { id: 'a' },
      target: { id: 'b' },
    });
    graph.addCell(link);

    // Stub findView on the link to return a mock view
    const mockLinkView = createMockLinkView();
    link.findView = jest.fn().mockReturnValue(mockLinkView) as unknown as typeof link.findView;

    const paper = {
      findViewByModel: jest.fn().mockReturnValue(mockLinkView),
    } as unknown as dia.Paper;

    const result = clearConnectedLinkViews(paper, graph, 'a');
    expect(result.size).toBe(1);
    expect(result.get('l1')).toEqual({ type: 'change', data: link });
    expect(mockLinkView._sourceMagnet).toBeNull();
    expect(mockLinkView._targetMagnet).toBeNull();
    expect(mockLinkView.requestConnectionUpdate).toHaveBeenCalledWith({ async: true });
  });
});

describe('executeClearViewForCell', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = createGraph();
  });

  it('iterates papers and skips ones without a paper instance', () => {
    graph.addCell({
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    const papers = [{ paper: undefined }];
    expect(() => executeClearViewForCell(papers, graph, 'a')).not.toThrow();
  });

  it('skips papers where the cell view is not present', () => {
    graph.addCell({
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });

    const findViewByModel = jest.fn();
    const paper = { findViewByModel } as unknown as dia.Paper;

    executeClearViewForCell([{ paper }], graph, 'a');
    expect(findViewByModel).toHaveBeenCalledWith('a');
  });

  it('cleans the cell view nodes cache and clears connected link views', () => {
    graph.addCell({
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    graph.addCell({
      id: 'b',
      type: 'element',
      position: { x: 50, y: 0 },
      size: { width: 10, height: 10 },
    });
    const link = new dia.Link({
      id: 'l1',
      type: 'standard.Link',
      source: { id: 'a' },
      target: { id: 'b' },
    });
    graph.addCell(link);

    const cleanNodesCache = jest.fn();
    const elementView = { cleanNodesCache } as unknown as dia.ElementView;

    const mockLinkView = createMockLinkView();
    link.findView = jest.fn().mockReturnValue(mockLinkView) as unknown as typeof link.findView;

    const paper = {
      findViewByModel: jest.fn().mockReturnValue(elementView),
    } as unknown as dia.Paper;

    executeClearViewForCell([{ paper }], graph, 'a');
    expect(cleanNodesCache).toHaveBeenCalledTimes(1);
    expect(mockLinkView.requestConnectionUpdate).toHaveBeenCalled();
  });
});

