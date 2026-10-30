import { dia, shapes } from '@joint/core';
import { GraphStore } from '../../store/graph-store';
import { LayerView } from '../layer-view';
import { PaperView } from '../paper';
import type { LayerRecord } from '../../types/layer.types';

describe('graph layer painting boundaries', () => {
  let store: GraphStore;
  let paper: PaperView;

  function mount(
    initialLayers?: readonly LayerRecord[],
    labelsLayer = false,
    cellViewNamespace?: dia.Paper.Options['cellViewNamespace']
  ) {
    store = new GraphStore({ initialLayers });
    paper = new PaperView({
      id: 'layer-visibility-regression',
      model: store.graph,
      async: false,
      frozen: false,
      labelsLayer,
      cellViewNamespace,
    });
    document.body.append(paper.el);
  }

  function addLink(id: string, layer?: string, withLabel = true) {
    const link = new shapes.standard.Link({
      id,
      layer,
      source: { x: 10, y: 10 },
      target: { x: 100, y: 100 },
      labels: withLabel ? [{ attrs: { text: { text: id } } }] : [],
    });
    store.graph.addCell(link);
    paper.updateViews();
    return link;
  }

  function detachedLabels(id: string): SVGElement {
    const labels = paper.getLayerView('labels').el.querySelector<SVGElement>(
      `.labels[model-id="${id}"]`
    );
    if (!labels) throw new Error(`Missing detached labels for ${id}`);
    return labels;
  }

  afterEach(() => {
    paper?.remove();
    store?.destroy(false);
  });

  it('uses the registered graph layer view when only the implicit default layer exists', () => {
    mount();
    expect(paper.getLayerView('cells')).toBeInstanceOf(LayerView);
    expect(paper.getLayerView('cells').el.classList.contains('joint-viewport')).toBe(true);
    store.applyLayer('cells', { visible: false });
    expect(paper.getLayerView('cells').el.style.visibility).toBe('hidden');
  });

  it('paints an explicitly hidden default-only initial layer as hidden', () => {
    mount([{ id: 'cells', visible: false }]);
    expect(paper.getLayerView('cells').el.style.visibility).toBe('hidden');
  });

  it('keeps the default layer hidden when a named layer is added after the paper mounted', () => {
    mount();
    store.applyLayer('cells', { visible: false });
    store.applyLayer('notes', {});
    paper.updateViews();
    expect(paper.getLayerView('cells').el.style.visibility).toBe('hidden');
    expect(paper.getLayerView('notes').el.style.visibility).toBe('');
    expect(paper.getLayerView('cells').el.classList.contains('joint-viewport')).toBe(true);
    expect(paper.getLayerView('notes').el.classList.contains('joint-viewport')).toBe(false);
  });

  it('preserves fresh default-layer z ordering and existing views when a cell is removed', () => {
    mount();
    const lower = new shapes.standard.Rectangle({ id: 'lower', z: 1 });
    const upper = new shapes.standard.Rectangle({ id: 'upper', z: 2 });
    store.graph.addCells([lower, upper]);
    paper.updateViews();
    const lowerView = paper.findViewByModel(lower);
    const upperView = paper.findViewByModel(upper);
    const layer = paper.getLayerView('cells');
    const paintedIds = () =>
      [...layer.el.children]
        .map((node) => node.getAttribute('model-id'))
        .filter((id) => id !== null);

    expect(paintedIds()).toEqual(['lower', 'upper']);
    lower.set('z', 3);
    paper.updateViews();
    expect(paintedIds()).toEqual(['upper', 'lower']);
    expect(paper.findViewByModel(lower)).toBe(lowerView);
    upper.remove();
    paper.updateViews();
    expect(paintedIds()).toEqual(['lower']);
    expect(layer.el.contains(upperView.el)).toBe(false);
    expect(paper.findViewByModel(lower)).toBe(lowerView);
  });

  it('hides detached labels with their own layer without hiding other links labels', () => {
    mount([{ id: 'cells' }, { id: 'notes', visible: false }], true);
    addLink('hidden-link', 'notes');
    addLink('visible-link');
    const hiddenLabels = detachedLabels('hidden-link');
    const visibleLabels = detachedLabels('visible-link');
    expect(getComputedStyle(hiddenLabels).visibility).toBe('hidden');
    expect(getComputedStyle(visibleLabels).visibility).not.toBe('hidden');

    store.applyLayer('notes', { visible: true });
    expect(getComputedStyle(hiddenLabels).visibility).not.toBe('hidden');
    store.applyLayer('notes', { visible: false });
    expect(getComputedStyle(hiddenLabels).visibility).toBe('hidden');
    expect(getComputedStyle(visibleLabels).visibility).not.toBe('hidden');
  });

  it('hides labels created after a link mounts in a hidden layer', () => {
    mount([{ id: 'cells' }, { id: 'notes', visible: false }], true);
    const link = addLink('late-label', 'notes', false);
    link.labels([{}, { attrs: { text: { text: 'Created while hidden' } } }]);
    paper.updateViews();
    const labels = detachedLabels('late-label');
    expect(labels.children).toHaveLength(2);
    expect(getComputedStyle(labels).visibility).toBe('hidden');
  });

  it('updates detached label visibility when a link moves into and out of a hidden layer', () => {
    mount([{ id: 'cells' }, { id: 'notes', visible: false }], true);
    const link = addLink('moving-link');
    link.layer('notes');
    paper.updateViews();
    expect(getComputedStyle(detachedLabels('moving-link')).visibility).toBe('hidden');

    link.layer('cells');
    paper.updateViews();
    expect(getComputedStyle(detachedLabels('moving-link')).visibility).not.toBe('hidden');
  });

  it('applies detached label visibility to a user-registered core LinkView subclass', () => {
    class CustomLinkView extends dia.LinkView {}
    const namespace = { standard: { LinkView: CustomLinkView } };
    mount([{ id: 'cells' }, { id: 'notes', visible: false }], true, namespace);
    const link = addLink('custom-link', 'notes');
    expect(paper.findViewByModel(link)).toBeInstanceOf(CustomLinkView);
    expect(getComputedStyle(detachedLabels('custom-link')).visibility).toBe('hidden');
    store.applyLayer('notes', { visible: true });
    expect(getComputedStyle(detachedLabels('custom-link')).visibility).not.toBe('hidden');
  });
});
