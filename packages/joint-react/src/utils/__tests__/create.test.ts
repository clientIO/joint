import { createElements, type InferElement } from '../create';

describe('create', () => {
  it('should create element with ts support for react element', () => {
    const elements = createElements([
      {
        id: '1',
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        somethingElse: 'test',
        attrs: {
          rect: { 'alignment-baseline': 'middle' },
        },
      },
    ]);
    expect(elements).toHaveLength(1);
    expect(elements[0]).toHaveProperty('id', '1');
    expect(elements[0]).toHaveProperty('x', 10);
    expect(elements[0]).toHaveProperty('y', 10);
    expect(elements[0]).toHaveProperty('width', 100);
    expect(elements[0]).toHaveProperty('height', 100);
    expect(elements[0]).toHaveProperty('somethingElse', 'test');
    expect(elements[0]).toHaveProperty('attrs.rect', { 'alignment-baseline': 'middle' });
  });
  it('should create element with ts support for react element defined in type', () => {
    const elements = createElements([
      {
        id: '1',
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        somethingElse: 'test',
        type: 'ReactElement',
        attrs: {
          rect: { 'alignment-baseline': 'middle' },
        },
      },
    ]);
    expect(elements).toHaveLength(1);
    expect(elements[0]).toHaveProperty('id', '1');
    expect(elements[0]).toHaveProperty('x', 10);
    expect(elements[0]).toHaveProperty('y', 10);
    expect(elements[0]).toHaveProperty('width', 100);
    expect(elements[0]).toHaveProperty('height', 100);
    expect(elements[0]).toHaveProperty('somethingElse', 'test');
    expect(elements[0]).toHaveProperty('attrs.rect', { 'alignment-baseline': 'middle' });
  });
  it('should create element with ts support for build-in element defined in type', () => {
    const elements = createElements([
      {
        id: '1',
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        type: 'standard.Rectangle',
        attrs: {
          body: { fill: 'red' },
        },
      },
    ]);
    expect(elements).toHaveLength(1);
    expect(elements[0]).toHaveProperty('id', '1');
    expect(elements[0]).toHaveProperty('x', 10);
    expect(elements[0]).toHaveProperty('y', 10);
    expect(elements[0]).toHaveProperty('width', 100);
    expect(elements[0]).toHaveProperty('height', 100);
    expect(elements[0]).toHaveProperty('type', 'standard.Rectangle');
    expect(elements[0]).toHaveProperty('attrs.body', { fill: 'red' });
  });
  it('should create element with custom element', () => {
    type MyCustomElement = {
      id: string;
      somethingNice: string;
    };
    const elements = createElements<MyCustomElement>([
      {
        somethingNice: 'test',
        id: '1',
      },
    ]);
    expect(elements).toHaveLength(1);
    expect(elements[0]).toHaveProperty('id', '1');
    expect(elements[0]).toHaveProperty('somethingNice', 'test');

    type NodeData = {
      id: string;
      label: string;
      nodeType: 'start' | 'step' | 'decision';
      cx: number;
      cy: number;
    };
    const flowchartNodes = createElements<NodeData>([
      { id: 'start', label: 'Start', nodeType: 'start', cx: 50, cy: 40 },
      {
        id: 'addToCart',
        label: 'Add to Cart',
        nodeType: 'step',
        cx: 200,
        cy: 40,
      },
    ]);
    type FlowchartNode = InferElement<typeof flowchartNodes>;
    expect(flowchartNodes).toHaveLength(2);
    expect(flowchartNodes[0]).toHaveProperty('id', 'start');
    expect(flowchartNodes[0]).toHaveProperty('label', 'Start');
    expect(flowchartNodes[0]).toHaveProperty('nodeType', 'start');
    const test: FlowchartNode = {
      id: 'start',
      label: 'Start',
      nodeType: 'start',
      cx: 50,
      cy: 40,
      height: 100,
      width: 100,
    };
    expect(test).toHaveProperty('id', 'start');
  });
  it('should return an empty array when called with an empty array', () => {
    const elements = createElements([]);
    expect(Array.isArray(elements)).toBe(true);
    expect(elements).toHaveLength(0);
  });
});
