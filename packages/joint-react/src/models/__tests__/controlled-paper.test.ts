import { dia, shapes } from '@joint/core';
import { ControlledPaper } from '../controlled-paper';

const DEFAULT_CELL_NAMESPACE = shapes;

/**
 * Helper to create a complete SVG structure like React would render.
 * Returns all layer elements with proper structure.
 */
function createReactSVGStructure(container: HTMLElement) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '800');
  svg.setAttribute('height', '600');

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.append(defs);

  const layers = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  layers.setAttribute('class', 'joint-layers');
  svg.append(layers);

  const gridLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridLayer.setAttribute('class', 'joint-grid-layer');
  layers.append(gridLayer);

  const backLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  backLayer.setAttribute('class', 'joint-back-layer');
  layers.append(backLayer);

  const cellsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  cellsLayer.setAttribute('class', 'joint-cells-layer joint-cells joint-viewport');
  layers.append(cellsLayer);

  const labelsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  labelsLayer.setAttribute('class', 'joint-labels-layer joint-viewport');
  layers.append(labelsLayer);

  const frontLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  frontLayer.setAttribute('class', 'joint-front-layer');
  layers.append(frontLayer);

  const toolsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  toolsLayer.setAttribute('class', 'joint-tools-layer');
  layers.append(toolsLayer);

  container.append(svg);

  return {
    svg,
    defs,
    layers,
    gridLayer,
    backLayer,
    cellsLayer,
    labelsLayer,
    frontLayer,
    toolsLayer,
  };
}

/**
 * Helper to create a React-like element in the cells layer.
 * Simulates what ReactPaperElement renders.
 */
function createReactElement(
  cellsLayer: SVGGElement,
  id: string,
  options: { x?: number; y?: number; width?: number; height?: number; content?: string } = {}
) {
  const { x = 0, y = 0, width = 100, height = 100, content = '' } = options;

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('model-id', id);
  g.dataset.type = 'ReactElement';
  g.setAttribute('class', 'joint-cell joint-type-reactelement joint-element joint-theme-default');
  g.setAttribute('transform', `translate(${x}, ${y})`);

  if (content) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.dataset.testid = `rect-${id}`;
    g.append(rect);
  }

  cellsLayer.append(g);
  return g;
}

/**
 * Helper to create a React-like link in the cells layer.
 */
function createReactLink(cellsLayer: SVGGElement, id: string) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('model-id', id);
  g.dataset.type = 'ReactLink';
  g.setAttribute('class', 'joint-cell joint-type-reactlink joint-link joint-theme-default');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M 0 0 L 100 100');
  g.append(path);

  cellsLayer.append(g);
  return g;
}

describe('ControlledPaper', () => {
  let graph: dia.Graph;
  let paper: ControlledPaper;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  });

  afterEach(() => {
    paper?.remove();
    container?.remove();
  });

  describe('constructor', () => {
    it('should extend dia.Paper', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      expect(paper).toBeInstanceOf(dia.Paper);
    });

    it('should initialize with controlled=true by default', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      expect(paper.isControlled()).toBe(true);
    });

    it('should allow controlled=false option', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        controlled: false,
      });

      expect(paper.isControlled()).toBe(false);
    });
  });

  describe('registerExternalElement', () => {
    it('should register an external element', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      paper.registerExternalElement('element', gElement, 'elem-1');

      expect(paper.hasExternalElement('element', 'elem-1')).toBe(true);
    });

    it('should register an external link element', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      paper.registerExternalElement('link', gElement, 'link-1');

      expect(paper.hasExternalElement('link', 'link-1')).toBe(true);
    });

    it('should register layer elements without cellId', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      const layerElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      paper.registerExternalElement('cells-layer', layerElement);

      expect(paper.hasExternalElement('cells-layer')).toBe(true);
    });
  });

  describe('unregisterExternalElement', () => {
    it('should unregister an external element', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      paper.registerExternalElement('element', gElement, 'elem-1');
      expect(paper.hasExternalElement('element', 'elem-1')).toBe(true);

      paper.unregisterExternalElement('element', 'elem-1');
      expect(paper.hasExternalElement('element', 'elem-1')).toBe(false);
    });

    it('should unregister layer elements', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      const layerElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      paper.registerExternalElement('cells-layer', layerElement);
      expect(paper.hasExternalElement('cells-layer')).toBe(true);

      paper.unregisterExternalElement('cells-layer');
      expect(paper.hasExternalElement('cells-layer')).toBe(false);
    });
  });

  describe('hasExternalElement', () => {
    it('should return false when element is not registered', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      expect(paper.hasExternalElement('element', 'non-existent')).toBe(false);
    });

    it('should return true when element is registered', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      paper.registerExternalElement('element', gElement, 'elem-1');

      expect(paper.hasExternalElement('element', 'elem-1')).toBe(true);
    });
  });

  describe('getExternalElement', () => {
    it('should return undefined when element is not registered', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      expect(paper.getExternalElement('element', 'non-existent')).toBeUndefined();
    });

    it('should return the registered element', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      paper.registerExternalElement('element', gElement, 'elem-1');

      expect(paper.getExternalElement('element', 'elem-1')).toBe(gElement);
    });
  });

  describe('remove', () => {
    it('should clear external elements map on remove', () => {
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
      });

      const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      paper.registerExternalElement('element', gElement, 'elem-1');

      expect(paper.hasExternalElement('element', 'elem-1')).toBe(true);

      paper.remove();

      // After remove, the map should be cleared
      expect(paper.hasExternalElement('element', 'elem-1')).toBe(false);
    });
  });

  /**
   * CRITICAL TESTS: React SVG Structure Integration
   *
   * These tests verify that ControlledPaper correctly uses React's pre-created
   * SVG structure instead of creating its own DOM elements.
   */
  describe('CRITICAL: render() with React SVG structure', () => {
    it('should use React-provided SVG instead of creating new one', () => {
      const reactStructure = createReactSVGStructure(container);

      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        cellsLayerElement: reactStructure.cellsLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });

      paper.render();

      // CRITICAL: Paper should use React's SVG, not create a new one
      expect(paper.svg).toBe(reactStructure.svg);
      expect(paper.layers).toBe(reactStructure.layers);
      expect(paper.defs).toBe(reactStructure.defs);
    });

    it('should create LayerViews pointing to React layer elements', () => {
      const reactStructure = createReactSVGStructure(container);

      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        cellsLayerElement: reactStructure.cellsLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });

      paper.render();

      // CRITICAL: LayerViews should use React's elements
      const gridLayerView = paper.getLayerView('grid');
      const backLayerView = paper.getLayerView('back');
      const labelsLayerView = paper.getLayerView('labels');
      const frontLayerView = paper.getLayerView('front');
      const toolsLayerView = paper.getLayerView('tools');

      expect(gridLayerView.el).toBe(reactStructure.gridLayer);
      expect(backLayerView.el).toBe(reactStructure.backLayer);
      expect(labelsLayerView.el).toBe(reactStructure.labelsLayer);
      expect(frontLayerView.el).toBe(reactStructure.frontLayer);
      expect(toolsLayerView.el).toBe(reactStructure.toolsLayer);
    });

    it('should NOT create duplicate SVG elements in container', () => {
      const reactStructure = createReactSVGStructure(container);

      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        cellsLayerElement: reactStructure.cellsLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });

      paper.render();

      // CRITICAL: Only ONE SVG should exist in container (React's)
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBe(1);
      expect(svgElements[0]).toBe(reactStructure.svg);

      // Only ONE joint-layers should exist
      const layersElements = container.querySelectorAll('.joint-layers');
      expect(layersElements.length).toBe(1);

      // Only ONE cells layer should exist
      const cellsLayerElements = container.querySelectorAll('.joint-cells-layer');
      expect(cellsLayerElements.length).toBe(1);
    });
  });

  /**
   * CRITICAL TESTS: DOM Fallback Lookup
   *
   * These tests verify that ControlledPaper can find React-rendered elements
   * in the DOM even if they haven't been explicitly registered yet.
   */
  describe('CRITICAL: DOM fallback element lookup', () => {
    it('should find element in DOM if not registered in Map', () => {
      const reactStructure = createReactSVGStructure(container);

      // Create React element in cells layer BEFORE paper is created
      const reactElement = createReactElement(reactStructure.cellsLayer, 'elem-1', {
        content: 'React content',
      });

      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });

      paper.render();

      // Add cell to graph - this will trigger view creation
      const element = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(element);
      paper.unfreeze();

      // CRITICAL: View should use the React element found via DOM lookup
      const view = paper.findViewByModel(element);
      expect(view).toBeDefined();
      expect(view?.el).toBe(reactElement);
    });

    it('should cache DOM-found elements in the Map for future lookups', () => {
      const reactStructure = createReactSVGStructure(container);

      // Create React element in cells layer
      createReactElement(reactStructure.cellsLayer, 'elem-1');

      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });

      paper.render();

      // Element not in Map yet
      expect(paper.hasExternalElement('element', 'elem-1')).toBe(false);

      // Add cell - triggers DOM lookup and caching
      const element = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(element);
      paper.unfreeze();

      // Now element should be cached in Map
      expect(paper.hasExternalElement('element', 'elem-1')).toBe(true);
    });
  });

  /**
   * CRITICAL TESTS: Full React Timing Scenario
   *
   * These tests simulate the exact timing that happens in ReactPaper:
   * 1. React renders SVG structure with elements inside cells layer
   * 2. Paper is created frozen with React's SVG elements
   * 3. Paper.render() is called to set up LayerViews
   * 4. Elements are registered (simulating children's useLayoutEffect)
   * 5. Paper is unfrozen (simulating parent's useEffect)
   * 6. Views should use React's elements, not create duplicates
   */
  describe('CRITICAL: Full React timing scenario', () => {
    it('should use React elements when following frozen → register → unfreeze pattern', () => {
      // Step 1: React renders SVG structure
      const reactStructure = createReactSVGStructure(container);

      // Step 2: React renders elements inside cells layer (like ReactPaperElement)
      const reactElement1 = createReactElement(reactStructure.cellsLayer, 'elem-1', {
        x: 0,
        y: 0,
        content: 'Element 1',
      });
      const reactElement2 = createReactElement(reactStructure.cellsLayer, 'elem-2', {
        x: 200,
        y: 0,
        content: 'Element 2',
      });

      // Step 3: Add cells to graph (this happens in GraphProvider before Paper)
      const cell1 = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const cell2 = new shapes.standard.Rectangle({
        id: 'elem-2',
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCells([cell1, cell2]);

      // Step 4: Create paper frozen (simulates parent useLayoutEffect)
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        async: false,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });
      paper.render();

      // Step 5: Register elements (simulates children useLayoutEffect)
      paper.registerExternalElement('element', reactElement1, 'elem-1');
      paper.registerExternalElement('element', reactElement2, 'elem-2');

      // Step 6: Unfreeze (simulates parent useEffect)
      paper.unfreeze();

      // VERIFY: Views should use React elements
      const view1 = paper.findViewByModel(cell1);
      const view2 = paper.findViewByModel(cell2);

      expect(view1?.el).toBe(reactElement1);
      expect(view2?.el).toBe(reactElement2);

      // VERIFY: React content is preserved
      expect(view1?.el.querySelector('[data-testid="rect-elem-1"]')).toBeTruthy();
      expect(view2?.el.querySelector('[data-testid="rect-elem-2"]')).toBeTruthy();
    });

    it('should work even without explicit registration (DOM fallback)', () => {
      // This tests the case where React renders elements but registration
      // hasn't happened yet (DOM fallback lookup)

      const reactStructure = createReactSVGStructure(container);

      // React renders elements
      const reactElement = createReactElement(reactStructure.cellsLayer, 'elem-1', {
        content: 'React content',
      });

      // Cells in graph
      const cell = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(cell);

      // Create paper - NO explicit registration
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        async: false,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });
      paper.render();
      paper.unfreeze();

      // VERIFY: View should use React element via DOM fallback
      const view = paper.findViewByModel(cell);
      expect(view?.el).toBe(reactElement);
    });

    it('should handle links with React elements', () => {
      const reactStructure = createReactSVGStructure(container);

      // React renders elements and link
      createReactElement(reactStructure.cellsLayer, 'elem-1');
      createReactElement(reactStructure.cellsLayer, 'elem-2', { x: 200 });
      const reactLink = createReactLink(reactStructure.cellsLayer, 'link-1');

      // Add cells and link to graph
      const cell1 = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const cell2 = new shapes.standard.Rectangle({
        id: 'elem-2',
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        id: 'link-1',
        source: { id: 'elem-1' },
        target: { id: 'elem-2' },
      });
      graph.addCells([cell1, cell2, link]);

      // Create paper
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        async: false,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });
      paper.render();

      // Register link element
      paper.registerExternalElement('link', reactLink, 'link-1');

      paper.unfreeze();

      // VERIFY: Link view should use React element
      const linkView = paper.findViewByModel(link);
      expect(linkView?.el).toBe(reactLink);
    });

    it('should NOT create duplicate elements in cells layer', () => {
      const reactStructure = createReactSVGStructure(container);

      // React renders elements
      const reactElement = createReactElement(reactStructure.cellsLayer, 'elem-1', {
        content: 'React content',
      });

      // Add cell
      const cell = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(cell);

      // Create paper
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        async: false,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });
      paper.render();
      paper.registerExternalElement('element', reactElement, 'elem-1');
      paper.unfreeze();

      // CRITICAL: Only ONE element with model-id="elem-1" should exist
      const elementsWithId = reactStructure.cellsLayer.querySelectorAll('[model-id="elem-1"]');
      expect(elementsWithId.length).toBe(1);
      expect(elementsWithId[0]).toBe(reactElement);
    });

    it('should preserve React content inside elements', () => {
      const reactStructure = createReactSVGStructure(container);

      // React renders element WITH content
      const reactElement = createReactElement(reactStructure.cellsLayer, 'elem-1', {
        content: 'React content',
      });

      // Verify React content exists
      expect(reactElement.querySelector('[data-testid="rect-elem-1"]')).toBeTruthy();

      // Add cell
      const cell = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(cell);

      // Create paper
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        async: false,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });
      paper.render();
      paper.registerExternalElement('element', reactElement, 'elem-1');
      paper.unfreeze();

      // CRITICAL: React content should still be there (JointJS didn't clear it)
      const view = paper.findViewByModel(cell);
      expect(view?.el.querySelector('[data-testid="rect-elem-1"]')).toBeTruthy();
    });
  });

  /**
   * CRITICAL TESTS: Late Registration (after unfreeze)
   *
   * Tests the scenario where elements are registered AFTER paper is unfrozen.
   * This can happen due to React timing edge cases.
   */
  describe('CRITICAL: Late registration after unfreeze', () => {
    it('should swap view element when registering after unfreeze', () => {
      const reactStructure = createReactSVGStructure(container);

      // Add cell BEFORE paper
      const cell = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(cell);

      // Create paper and unfreeze IMMEDIATELY (no registration yet)
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        async: false,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });
      paper.render();
      paper.unfreeze();

      // At this point, JointJS created its own element for the view
      // (via DOM fallback it might have found nothing)

      // NOW React element appears and registers (late)
      const reactElement = createReactElement(reactStructure.cellsLayer, 'elem-1', {
        content: 'Late React content',
      });
      paper.registerExternalElement('element', reactElement, 'elem-1');

      // VERIFY: View should now use React element
      const view = paper.findViewByModel(cell);
      expect(view?.el).toBe(reactElement);
    });

    it('should remove old JointJS element when swapping to React element', () => {
      const reactStructure = createReactSVGStructure(container);

      // Add cell
      const cell = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(cell);

      // Create paper - no React element yet, so JointJS will create one
      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        async: false,
        controlled: true,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });
      paper.render();
      paper.unfreeze();

      // React element appears late and gets registered
      const reactElement = createReactElement(reactStructure.cellsLayer, 'elem-late', {
        content: 'Late content',
      });
      reactElement.setAttribute('model-id', 'elem-1'); // Same ID as cell
      paper.registerExternalElement('element', reactElement, 'elem-1');

      // CRITICAL: Only ONE element with model-id should exist
      const elementsWithId = reactStructure.cellsLayer.querySelectorAll('[model-id="elem-1"]');
      expect(elementsWithId.length).toBe(1);
      expect(elementsWithId[0]).toBe(reactElement);
    });
  });

  /**
   * Tests for insertView behavior with React elements
   */
  describe('insertView with React elements', () => {
    it('should skip DOM insertion if element already in correct layer', () => {
      const reactStructure = createReactSVGStructure(container);

      // React element already in cells layer
      const reactElement = createReactElement(reactStructure.cellsLayer, 'elem-1');

      // Add cell
      const cell = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(cell);

      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        async: false,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });
      paper.render();
      paper.registerExternalElement('element', reactElement, 'elem-1');
      paper.unfreeze();

      // Element should still be in cells layer (not moved/duplicated)
      expect(reactElement.parentNode).toBe(reactStructure.cellsLayer);

      // Only one element
      const elementsWithId = reactStructure.cellsLayer.querySelectorAll('[model-id="elem-1"]');
      expect(elementsWithId.length).toBe(1);
    });
  });

  /**
   * Tests for controlled mode cleanup
   */
  describe('Controlled mode cleanup', () => {
    it('should NOT remove React DOM elements on paper.remove() in controlled mode', () => {
      const reactStructure = createReactSVGStructure(container);
      const reactElement = createReactElement(reactStructure.cellsLayer, 'elem-1');

      const cell = new shapes.standard.Rectangle({
        id: 'elem-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graph.addCell(cell);

      paper = new ControlledPaper({
        el: container,
        model: graph,
        cellNamespace: DEFAULT_CELL_NAMESPACE,
        frozen: true,
        controlled: true,
        svg: reactStructure.svg,
        layers: reactStructure.layers,
        defs: reactStructure.defs,
        cellsLayerElement: reactStructure.cellsLayer,
        gridLayerElement: reactStructure.gridLayer,
        backLayerElement: reactStructure.backLayer,
        labelsLayerElement: reactStructure.labelsLayer,
        frontLayerElement: reactStructure.frontLayer,
        toolsLayerElement: reactStructure.toolsLayer,
      });
      paper.render();
      paper.registerExternalElement('element', reactElement, 'elem-1');
      paper.unfreeze();

      // Verify element is in DOM
      expect(reactElement.parentNode).toBe(reactStructure.cellsLayer);

      // Call remove
      paper.remove();

      // CRITICAL: React element should STILL be in DOM (React owns it)
      expect(reactElement.parentNode).toBe(reactStructure.cellsLayer);

      // SVG should still be in container (React owns it)
      expect(reactStructure.svg.parentNode).toBe(container);
    });
  });
});
