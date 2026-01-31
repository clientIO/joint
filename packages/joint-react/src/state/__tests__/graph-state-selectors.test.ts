/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/no-alphabetical-sort */
import { dia, shapes } from '@joint/core';
import { ReactElement } from '../../models/react-element';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import {
  mapElementAttributesToData,
  defaultMapDataToElementAttributes,
  mapLinkAttributesToData,
  defaultMapDataToLinkAttributes,
  createDefaultElementMapper,
  createDefaultGraphToElementMapper,
  createDefaultLinkMapper,
  createDefaultGraphToLinkMapper,
  type GraphToElementOptions,
  type ElementToGraphOptions,
  type GraphToLinkOptions,
  type LinkToGraphOptions,
} from '../graph-state-selectors';

const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };

// Helper functions to create options with defaultAttributes
const createElementToGraphOptions = <E extends GraphElement>(
  id: string,
  data: E,
  graph: dia.Graph
): ElementToGraphOptions<E> => ({
  id,
  data,
  graph,
  defaultAttributes: createDefaultElementMapper(id, data),
});

const createGraphToElementOptions = <E extends GraphElement>(
  id: string,
  cell: dia.Element,
  graph: dia.Graph,
  previous?: E
): GraphToElementOptions<E> => ({
  id,
  cell,
  graph,
  previous,
  defaultAttributes: createDefaultGraphToElementMapper(cell, previous),
});

const createLinkToGraphOptions = <L extends GraphLink>(
  id: string,
  data: L,
  graph: dia.Graph
): LinkToGraphOptions<L> => ({
  id,
  data,
  graph,
  defaultAttributes: createDefaultLinkMapper(id, data, graph),
});

const createGraphToLinkOptions = <L extends GraphLink>(
  id: string,
  cell: dia.Link,
  graph: dia.Graph,
  previous?: L
): GraphToLinkOptions<L> => ({
  id,
  cell,
  graph,
  previous,
  defaultAttributes: createDefaultGraphToLinkMapper(cell, previous),
});

describe('graph-state-selectors', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  });

  afterEach(() => {
    graph.clear();
  });

  describe('defaultAttributes function', () => {
    it('should pass defaultAttributes in ElementToGraphOptions', () => {
      const id = 'element-1';
      const data: GraphElement = {
        x: 100,
        y: 50,
        width: 200,
        height: 100,
      };

      let receivedDefaultMapper: (() => dia.Cell.JSON) | undefined;

      const customSelector = (options: ElementToGraphOptions<GraphElement>) => {
        receivedDefaultMapper = options.defaultAttributes;
        return options.defaultAttributes();
      };

      const options = createElementToGraphOptions(id, data, graph);
      customSelector(options);

      expect(receivedDefaultMapper).toBeDefined();
    });
  });

  describe('defaultMapDataToElementAttributes', () => {
    it('should map element to graph cell JSON', () => {
      const id = 'element-1';
      const data: GraphElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };

      const options = createElementToGraphOptions(id, data, graph);

      const elementAsGraphJson = defaultMapDataToElementAttributes(options);

      expect(elementAsGraphJson).toMatchObject({
        id: 'element-1',
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      // Round-trip: element → graph → element
      graph.syncCells([elementAsGraphJson], { remove: true });

      const cell = graph.getCell('element-1') as dia.Element<dia.Element.Attributes>;
      const elementFromGraph = mapElementAttributesToData(
        createGraphToElementOptions(id, cell, graph)
      );

      expect(elementFromGraph).toMatchObject({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });

    it('should handle element without type (defaults to REACT_TYPE)', () => {
      const id = 'element-1';
      const data: GraphElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      };

      const options = createElementToGraphOptions(id, data, graph);

      const elementAsGraphJson = defaultMapDataToElementAttributes(options);

      expect(elementAsGraphJson.type).toBe('ReactElement');

      // Round-trip: element → graph → element
      graph.syncCells([elementAsGraphJson], { remove: true });

      const cell = graph.getCell('element-1') as dia.Element<dia.Element.Attributes>;
      const elementFromGraph = mapElementAttributesToData(
        createGraphToElementOptions(id, cell, graph)
      );

      expect(elementFromGraph).toMatchObject({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });

    it('should preserve all element properties', () => {
      const id = 'element-1';
      const data: GraphElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
        ports: { items: [] },
        angle: 45,
      };

      const options = createElementToGraphOptions(id, data, graph);

      const elementAsGraphJson = defaultMapDataToElementAttributes(options);

      expect(elementAsGraphJson).toMatchObject({
        id: 'element-1',
        ports: { items: [] },
        angle: 45,
      });

      // Round-trip: element → graph → element
      graph.syncCells([elementAsGraphJson], { remove: true });

      const cell = graph.getCell('element-1') as dia.Element<dia.Element.Attributes>;
      const elementFromGraph = mapElementAttributesToData(
        createGraphToElementOptions(id, cell, graph)
      );

      expect(elementFromGraph).toMatchObject({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        ports: { items: [] },
        angle: 45,
      });
    });
  });

  describe('mapElementAttributesToData', () => {
    it('should map graph cell to element without previous state', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      const options = createGraphToElementOptions(id, cell, graph);

      const elementFromGraph = mapElementAttributesToData(options);

      expect(elementFromGraph).toMatchObject({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });

      // Round-trip: element → graph → element
      const recreatedElementAsGraphJson = defaultMapDataToElementAttributes(
        createElementToGraphOptions(id, elementFromGraph, graph)
      );
      graph.clear();
      graph.syncCells([recreatedElementAsGraphJson], { remove: true });

      const roundTripCell = graph.getCell('element-1') as dia.Element<dia.Element.Attributes>;
      const elementFromRoundTrip = mapElementAttributesToData(
        createGraphToElementOptions(id, roundTripCell, graph)
      );

      expect(elementFromRoundTrip).toMatchObject({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });

    it('should map graph cell to element with previous state, filtering properties', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        data: { customProp: 'from-graph', extraProp: 'should-be-filtered' },
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      type ExtendedElement = GraphElement & {
        customProp?: string;
        extraProp?: string;
      };

      const previous: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        customProp: undefined,
        // extraProp is not in previous, so it should be filtered out
      };

      const options = createGraphToElementOptions(id, cell, graph, previous);

      const result = mapElementAttributesToData(options);

      // Should only include properties that exist in previous state
      expect(result).toMatchObject({
        x: 10, // Updated from graph
        y: 20, // Updated from graph
        width: 100, // Updated from graph
        height: 50, // Updated from graph
        customProp: 'from-graph', // Updated from graph data
      });

      // Should NOT include extraProp because it doesn't exist in previous state
      expect(result).not.toHaveProperty('extraProp');
    });

    it('should preserve undefined properties from previous state', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      type ExtendedElement = GraphElement & {
        customProp?: string;
      };

      const previous: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        customProp: undefined, // Explicitly undefined in previous
      };

      const options = createGraphToElementOptions(id, cell, graph, previous);

      const result = mapElementAttributesToData(options);

      // Should include customProp even though it's undefined in previous
      expect(result).toHaveProperty('customProp');
      expect((result as ExtendedElement).customProp).toBeUndefined();
    });

    it('should handle element with non-REACT_TYPE', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'standard.Rectangle',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      const options = createGraphToElementOptions(id, cell, graph);

      const elementFromGraph = mapElementAttributesToData(options);

      expect(elementFromGraph.type).toBeUndefined();
    });

    it('should extract ports from cell', () => {
      const id = 'element-1';
      const ports = {
        items: [
          {
            id: 'port-1',
            group: 'group-1',
          },
        ],
      };
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        ports,
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      const options = createGraphToElementOptions(id, cell, graph);

      const result = mapElementAttributesToData(options);

      expect(result.ports).toEqual(ports);
    });
  });

  describe('defaultMapDataToLinkAttributes', () => {
    it('should map link to graph cell JSON', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
      };

      const options = createLinkToGraphOptions(id, link, graph);

      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
      });

      // Round-trip: link → graph → link
      graph.syncCells([linkAsGraphJson], { remove: true });

      const linkCell = graph.getCell('link-1') as dia.Link<dia.Link.Attributes>;
      const linkFromGraph = mapLinkAttributesToData(createGraphToLinkOptions(id, linkCell, graph));

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
      });
    });

    it('should handle link with object source and target', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: 'standard.Link',
      };

      const options = createLinkToGraphOptions(id, link, graph);

      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: 'standard.Link',
      });

      // Round-trip: link → graph → link
      graph.syncCells([linkAsGraphJson], { remove: true });

      const linkCell = graph.getCell('link-1') as dia.Link<dia.Link.Attributes>;
      const linkFromGraph = mapLinkAttributesToData(createGraphToLinkOptions(id, linkCell, graph));

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: 'standard.Link',
      });
    });

    it('should use theme color property for stroke', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        color: 'red',
      };

      const options = createLinkToGraphOptions(id, link, graph);

      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson.attrs).toBeDefined();
      expect(linkAsGraphJson.attrs?.line?.stroke).toBe('red');
    });

    it('should preserve all link properties', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 10,
        markup: [{ tagName: 'path' }],
        defaultLabel: { markup: [{ tagName: 'text' }] },
      };

      const options = createLinkToGraphOptions(id, link, graph);

      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson).toMatchObject({
        id: 'link-1',
        z: 10,
        markup: [{ tagName: 'path' }],
        defaultLabel: { markup: [{ tagName: 'text' }] },
      });
    });
  });

  describe('mapLinkAttributesToData', () => {
    it('should map graph link to link without previous state', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        z: 5,
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const linkCell = graph.getCell('link-1') as dia.Link;

      const options = createGraphToLinkOptions(id, linkCell, graph);

      const linkFromGraph = mapLinkAttributesToData(options);

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 5,
      });
    });

    it('should map graph link to link with previous state, filtering properties', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        z: 5,
        data: { customProp: 'from-graph', extraProp: 'should-be-filtered' },
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const linkCell = graph.getCell('link-1') as dia.Link;

      type ExtendedLink = GraphLink & {
        customProp?: string;
        extraProp?: string;
      };

      const previous: ExtendedLink = {
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 3,
        customProp: undefined,
        // extraProp is not in previous, so it should be filtered out
      };

      const options = createGraphToLinkOptions(id, linkCell, graph, previous);

      const linkFromGraph = mapLinkAttributesToData(options);

      // Should only include properties that exist in previous state
      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 5, // Updated from graph
        customProp: 'from-graph', // Updated from graph data
      });

      // Should NOT include extraProp because it doesn't exist in previous state
      expect(linkFromGraph).not.toHaveProperty('extraProp');
    });

    it('should preserve undefined properties from previous state', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const linkCell = graph.getCell('link-1') as dia.Link;

      type ExtendedLink = GraphLink & {
        customProp?: string;
      };

      const previous: ExtendedLink = {
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        customProp: undefined, // Explicitly undefined in previous
      };

      const options = createGraphToLinkOptions(id, linkCell, graph, previous);

      const linkFromGraph = mapLinkAttributesToData(options);

      // Should include customProp even though it's undefined in previous
      expect(linkFromGraph).toHaveProperty('customProp');
      expect((linkFromGraph as ExtendedLink).customProp).toBeUndefined();
    });

    it('should extract source and target from cell', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        id: 'link-1',
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const linkCell = graph.getCell('link-1') as dia.Link;

      const options = createGraphToLinkOptions(id, linkCell, graph);

      const linkFromGraph = mapLinkAttributesToData(options);

      expect(linkFromGraph.source).toEqual({ id: 'element-1', port: 'port-1' });
      expect(linkFromGraph.target).toEqual({ id: 'element-2', port: 'port-2' });
    });

    it('should extract z, markup, and defaultLabel from cell', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        z: 10,
        markup: [{ tagName: 'path' }],
        defaultLabel: { markup: [{ tagName: 'text' }] },
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const linkCell = graph.getCell('link-1') as dia.Link;

      const options = createGraphToLinkOptions(id, linkCell, graph);

      const linkFromGraph = mapLinkAttributesToData(options);

      expect(linkFromGraph.z).toBe(10);
      expect(linkFromGraph.markup).toEqual([{ tagName: 'path' }]);
      expect(linkFromGraph.defaultLabel).toEqual({ markup: [{ tagName: 'text' }] });
    });

    it('should include all cell attributes when no previous state', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        attrs: {
          line: {
            stroke: 'blue',
            strokeWidth: 2,
          },
        },
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const linkCell = graph.getCell('link-1') as dia.Link;

      const options = createGraphToLinkOptions(id, linkCell, graph);

      const linkFromGraph = mapLinkAttributesToData(options);

      expect(linkFromGraph.attrs).toBeDefined();
      expect(linkFromGraph.attrs).toMatchObject({
        line: {
          stroke: 'blue',
          strokeWidth: 2,
        },
      });
    });
  });

  describe('integration: state is source of truth', () => {
    it('should not add new properties from graph when previous state exists', () => {
      const id = 'element-1';
      // Create element in graph with extra properties
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        data: { graphOnlyProp: 'should-not-appear', anotherGraphProp: 'also-should-not-appear' },
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      // Previous state only has specific properties
      const previous: GraphElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        // graphOnlyProp and anotherGraphProp are NOT in previous state
      };

      const options = createGraphToElementOptions(id, cell, graph, previous);

      const elementFromGraph = mapElementAttributesToData(options);

      // Should only have properties from previous state
      expect(elementFromGraph).not.toHaveProperty('graphOnlyProp');
      expect(elementFromGraph).not.toHaveProperty('anotherGraphProp');
      expect(Object.keys(elementFromGraph).toSorted()).toEqual(
        ['x', 'y', 'width', 'height'].toSorted()
      );
    });

    it('should update existing properties from graph even if undefined in previous', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        data: { customProp: 'updated-value' },
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      type ExtendedElement = GraphElement & {
        customProp?: string;
      };

      const previous: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        customProp: undefined, // Exists but undefined
      };

      const options = createGraphToElementOptions(id, cell, graph, previous);

      const elementFromGraph = mapElementAttributesToData(options);

      // Should update customProp from graph data
      expect((elementFromGraph as ExtendedElement).customProp).toBe('updated-value');
    });
  });

  describe('integration: links with syncCells', () => {
    it('should handle link round-trip using syncCells', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 5,
      };

      // Convert link to graph JSON
      const linkAsGraphJson = defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, link, graph));

      // Store in graph using syncCells
      graph.syncCells([linkAsGraphJson], { remove: true });

      // Retrieve from graph
      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      expect(graphLinkCell).toBeDefined();

      // Convert back to link
      const linkFromGraph = mapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph)
      );

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 5,
      });
    });

    it('should handle link with complex properties using syncCells', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: 'standard.Link',
        z: 10,
        markup: [{ tagName: 'path' }],
        defaultLabel: { markup: [{ tagName: 'text' }] },
        attrs: {
          line: {
            stroke: 'blue',
            strokeWidth: 2,
          },
        },
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, link, graph));

      graph.syncCells([linkAsGraphJson], { remove: true });

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = mapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph)
      );

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: 'standard.Link',
        z: 10,
      });
      expect(linkFromGraph.markup).toEqual([{ tagName: 'path' }]);
      expect(linkFromGraph.defaultLabel).toEqual({ markup: [{ tagName: 'text' }] });
      expect(linkFromGraph.attrs).toBeDefined();
    });

    it('should filter link properties with previous state when using syncCells', () => {
      type ExtendedLink = GraphLink & {
        customProp?: string;
        extraProp?: string;
        anotherProp?: number;
      };

      const id = 'link-1';
      const link: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 5,
        customProp: 'value-from-state',
        extraProp: 'should-be-filtered',
        anotherProp: 42,
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, link, graph));

      // Add extra properties to graph JSON that don't exist in state
      const linkWithExtraProps = {
        ...linkAsGraphJson,
        graphOnlyProp: 'should-not-appear',
        anotherGraphProp: 'also-should-not-appear',
      };

      graph.syncCells([linkWithExtraProps], { remove: true });

      const previous: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 3,
        customProp: undefined,
        anotherProp: 0,
        // extraProp is not in previous, so it should be filtered out
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = mapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previous)
      );

      // Should only include properties that exist in previous state
      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 5, // Updated from graph
        customProp: 'value-from-state', // From graph data
        anotherProp: 42, // Updated from graph data
      });

      // Should NOT include properties that don't exist in previous state
      expect(linkFromGraph).not.toHaveProperty('extraProp');
      expect(linkFromGraph).not.toHaveProperty('graphOnlyProp');
      expect(linkFromGraph).not.toHaveProperty('anotherGraphProp');
    });

    it('should handle multiple links with syncCells and previous state filtering', () => {
      type ExtendedLink = GraphLink & {
        label?: string;
        metadata?: Record<string, unknown>;
      };

      const links: Array<{ id: string; data: ExtendedLink }> = [
        {
          id: 'link-1',
          data: {
            source: 'element-1',
            target: 'element-2',
            type: 'standard.Link',
            z: 1,
            label: 'Link 1',
          },
        },
        {
          id: 'link-2',
          data: {
            source: 'element-2',
            target: 'element-3',
            type: 'standard.Link',
            z: 2,
            metadata: { key: 'value' },
          },
        },
      ];

      const linksAsGraphJson = links.map(({ id, data }) =>
        defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, data, graph))
      );

      graph.syncCells(linksAsGraphJson, { remove: true });

      // Previous state only has specific properties for each link
      const previousLinks: Array<{ id: string; data: ExtendedLink }> = [
        {
          id: 'link-1',
          data: {
            source: 'element-1',
            target: 'element-2',
            type: 'standard.Link',
            z: 0, // Exists in previous
            label: undefined, // Exists but undefined
          },
        },
        {
          id: 'link-2',
          data: {
            source: 'element-2',
            target: 'element-3',
            type: 'standard.Link',
            z: 0, // Exists in previous
            metadata: undefined, // Exists but undefined
          },
        },
      ];

      const retrievedLinks = graph.getLinks().map((graphLinkCell) => {
        const id = graphLinkCell.id as string;
        const previous = previousLinks.find((l) => l.id === id)?.data;
        return {
          id,
          data: mapLinkAttributesToData(createGraphToLinkOptions(id, graphLinkCell, graph, previous)),
        };
      });

      expect(retrievedLinks).toHaveLength(2);

      const link1 = retrievedLinks.find((l) => l.id === 'link-1');
      expect(link1?.data).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 1, // Updated from graph
        label: 'Link 1', // Updated from graph data
      });
      expect(link1?.data).not.toHaveProperty('metadata');

      const link2 = retrievedLinks.find((l) => l.id === 'link-2');
      expect(link2?.data).toMatchObject({
        source: { id: 'element-2' },
        target: { id: 'element-3' },
        type: 'standard.Link',
        z: 2, // Updated from graph
        metadata: { key: 'value' }, // Updated from graph data
      });
      expect(link2?.data).not.toHaveProperty('label');
    });

    it('should preserve undefined properties from previous state when using syncCells', () => {
      type ExtendedLink = GraphLink & {
        optionalProp?: string;
        anotherOptionalProp?: number;
      };

      const id = 'link-1';
      const link: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        optionalProp: 'has-value',
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, link, graph));

      graph.syncCells([linkAsGraphJson], { remove: true });

      const previous: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        optionalProp: undefined, // Explicitly undefined
        anotherOptionalProp: undefined, // Explicitly undefined
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = mapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previous)
      );

      // Should include optionalProp with value from graph data
      expect((linkFromGraph as ExtendedLink).optionalProp).toBe('has-value');
      // Should include anotherOptionalProp even though it's undefined in previous
      expect(linkFromGraph).toHaveProperty('anotherOptionalProp');
      expect((linkFromGraph as ExtendedLink).anotherOptionalProp).toBeUndefined();
    });

    it('should handle link updates with syncCells and previous state', () => {
      type ExtendedLink = GraphLink & {
        status?: string;
        weight?: number;
      };

      const id = 'link-1';
      // Initial link
      const initialLink: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        status: 'active',
        weight: 1,
      };

      const initialLinkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, initialLink, graph)
      );

      graph.syncCells([initialLinkAsGraphJson], { remove: true });

      // Update link with new values
      const updatedLink: ExtendedLink & { newProp?: string } = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        status: 'inactive',
        weight: 2,
        newProp: 'should-be-filtered',
      };

      const updatedLinkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, updatedLink, graph)
      );

      graph.syncCells([updatedLinkAsGraphJson], { remove: true });

      // Previous state only has status and weight
      const previous: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        status: 'active',
        weight: 1,
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = mapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previous)
      );

      // Should only include properties from previous state
      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        status: 'inactive', // Updated from graph data
        weight: 2, // Updated from graph data
      });

      // Should NOT include newProp
      expect(linkFromGraph).not.toHaveProperty('newProp');
    });

    it('should handle link with attrs merging when using syncCells', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        attrs: {
          line: {
            stroke: 'red',
            strokeWidth: 3,
          },
        },
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, link, graph));

      graph.syncCells([linkAsGraphJson], { remove: true });

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = mapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph)
      );

      expect(linkFromGraph.attrs).toBeDefined();
      expect(linkFromGraph.attrs).toMatchObject({
        line: {
          stroke: 'red',
          strokeWidth: 3,
        },
      });
    });
  });

  describe('integration: new properties defined in state type', () => {
    it('should return new element property when it exists in previous state (even if undefined)', () => {
      type ExtendedElement = GraphElement & {
        newProperty?: string;
        anotherNewProperty?: number;
      };

      const id = 'element-1';
      // Create element in graph with new properties
      const element: ExtendedElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        newProperty: 'value-from-graph',
        anotherNewProperty: 42,
      };

      const elementAsGraphJson = defaultMapDataToElementAttributes(
        createElementToGraphOptions(id, element, graph)
      );

      graph.syncCells([elementAsGraphJson], { remove: true });

      // Previous state has newProperty defined (but undefined) and anotherNewProperty defined
      const previous: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        newProperty: undefined, // Defined in state type but undefined
        anotherNewProperty: 0, // Defined in state type with initial value
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = mapElementAttributesToData(
        createGraphToElementOptions(id, graphElement, graph, previous)
      );

      // Should return newProperty with value from graph data
      expect((elementFromGraph as ExtendedElement).newProperty).toBe('value-from-graph');
      // Should return anotherNewProperty with value from graph data
      expect((elementFromGraph as ExtendedElement).anotherNewProperty).toBe(42);
    });

    it('should return new link property when it exists in previous state (even if undefined)', () => {
      type ExtendedLink = GraphLink & {
        newLinkProperty?: string;
        priority?: number;
        metadata?: Record<string, unknown>;
      };

      const id = 'link-1';
      // Create link in graph with new properties
      const link: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        newLinkProperty: 'value-from-graph',
        priority: 10,
        metadata: { key: 'value' },
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, link, graph));

      graph.syncCells([linkAsGraphJson], { remove: true });

      // Previous state has all properties defined (some undefined)
      const previous: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        newLinkProperty: undefined, // Defined in state type but undefined
        priority: undefined, // Defined in state type but undefined
        metadata: undefined, // Defined in state type but undefined
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = mapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previous)
      );

      // Should return all properties with values from graph data
      expect((linkFromGraph as ExtendedLink).newLinkProperty).toBe('value-from-graph');
      expect((linkFromGraph as ExtendedLink).priority).toBe(10);
      expect((linkFromGraph as ExtendedLink).metadata).toEqual({ key: 'value' });
    });

    it('should return multiple new element properties when all are defined in previous state', () => {
      type ExtendedElement = GraphElement & {
        status?: string;
        category?: string;
        tags?: string[];
        score?: number;
      };

      const id = 'element-1';
      const element: ExtendedElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        status: 'active',
        category: 'type-a',
        tags: ['tag1', 'tag2'],
        score: 95,
      };

      const elementAsGraphJson = defaultMapDataToElementAttributes(
        createElementToGraphOptions(id, element, graph)
      );

      graph.syncCells([elementAsGraphJson], { remove: true });

      // Previous state defines all properties (some undefined)
      const previous: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        status: undefined,
        category: undefined,
        tags: undefined,
        score: undefined,
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = mapElementAttributesToData(
        createGraphToElementOptions(id, graphElement, graph, previous)
      );

      // All properties should be returned with values from graph data
      expect((elementFromGraph as ExtendedElement).status).toBe('active');
      expect((elementFromGraph as ExtendedElement).category).toBe('type-a');
      expect((elementFromGraph as ExtendedElement).tags).toEqual(['tag1', 'tag2']);
      expect((elementFromGraph as ExtendedElement).score).toBe(95);
    });

    it('should return new link properties with complex nested structures when defined in previous state', () => {
      type ExtendedLink = GraphLink & {
        config?: {
          style?: string;
          animation?: boolean;
        };
        labels?: Array<{ text: string; position?: number }>;
        customData?: Record<string, unknown>;
      };

      const id = 'link-1';
      const link: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        config: {
          style: 'dashed',
          animation: true,
        },
        labels: [
          { text: 'Label 1', position: 0.3 },
          { text: 'Label 2', position: 0.7 },
        ],
        customData: {
          source: 'api',
          timestamp: 1_234_567_890,
        },
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, link, graph));

      graph.syncCells([linkAsGraphJson], { remove: true });

      // Previous state defines all properties (all undefined)
      const previous: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        config: undefined,
        customData: undefined,
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = mapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previous)
      );

      // All complex properties should be returned with values from graph data
      expect((linkFromGraph as ExtendedLink).config).toEqual({
        style: 'dashed',
        animation: true,
      });
      expect((linkFromGraph as ExtendedLink).customData).toEqual({
        source: 'api',
        timestamp: 1_234_567_890,
      });
    });

    it('should return new element properties when some are defined and some are not in previous state', () => {
      type ExtendedElement = GraphElement & {
        definedProperty?: string;
        undefinedProperty?: number;
        notInPreviousProperty?: boolean;
      };

      const id = 'element-1';
      const element: ExtendedElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        definedProperty: 'value-1',
        undefinedProperty: 100,
        notInPreviousProperty: true,
      };

      const elementAsGraphJson = defaultMapDataToElementAttributes(
        createElementToGraphOptions(id, element, graph)
      );

      graph.syncCells([elementAsGraphJson], { remove: true });

      // Previous state only defines some properties
      const previous: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        definedProperty: undefined, // Defined in previous
        undefinedProperty: undefined, // Defined in previous
        // notInPreviousProperty is NOT in previous
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = mapElementAttributesToData(
        createGraphToElementOptions(id, graphElement, graph, previous)
      );

      // Properties defined in previous should be returned from graph data
      expect((elementFromGraph as ExtendedElement).definedProperty).toBe('value-1');
      expect((elementFromGraph as ExtendedElement).undefinedProperty).toBe(100);

      // Property not in previous should NOT be returned
      expect(elementFromGraph).not.toHaveProperty('notInPreviousProperty');
    });

    it('should return new link properties when mixed with existing GraphLink properties', () => {
      type ExtendedLink = GraphLink & {
        customLabel?: string;
        weight?: number;
      };

      const id = 'link-1';
      const link: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 5, // Existing GraphLink property
        markup: [{ tagName: 'path' }], // Existing GraphLink property
        customLabel: 'Custom', // New property
        weight: 10, // New property
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, link, graph));

      graph.syncCells([linkAsGraphJson], { remove: true });

      // Previous state has both existing and new properties
      const previous: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 3, // Existing property
        customLabel: undefined, // New property defined
        weight: undefined, // New property defined
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = mapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previous)
      );

      // All properties should be returned
      expect(linkFromGraph.z).toBe(5); // Updated from graph
      expect((linkFromGraph as ExtendedLink).customLabel).toBe('Custom');
      expect((linkFromGraph as ExtendedLink).weight).toBe(10);
    });

    it('should properly return new properties after element update via syncCells', () => {
      type ExtendedElement = GraphElement & {
        version?: number;
        lastModified?: string;
      };

      const id = 'element-1';
      // Initial element without new properties
      const initialElement: ExtendedElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      };

      const initialElementAsGraphJson = defaultMapDataToElementAttributes(
        createElementToGraphOptions(id, initialElement, graph)
      );

      graph.syncCells([initialElementAsGraphJson], { remove: true });

      // Update element with new properties
      const updatedElement: ExtendedElement = {
        x: 15,
        y: 25,
        width: 120,
        height: 60,
        version: 2,
        lastModified: '2024-01-01',
      };

      const updatedElementAsGraphJson = defaultMapDataToElementAttributes(
        createElementToGraphOptions(id, updatedElement, graph)
      );

      graph.syncCells([updatedElementAsGraphJson], { remove: true });

      // Previous state now includes the new properties
      const previous: ExtendedElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        version: undefined,
        lastModified: undefined,
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = mapElementAttributesToData(
        createGraphToElementOptions(id, graphElement, graph, previous)
      );

      // Should return all properties including new ones from graph data
      expect(elementFromGraph.x).toBe(15);
      expect(elementFromGraph.y).toBe(25);
      expect(elementFromGraph.width).toBe(120);
      expect(elementFromGraph.height).toBe(60);
      expect((elementFromGraph as ExtendedElement).version).toBe(2);
      expect((elementFromGraph as ExtendedElement).lastModified).toBe('2024-01-01');
    });
  });

  describe('custom selector with defaultAttributes', () => {
    it('should allow using defaultAttributes as-is', () => {
      type CustomElement = GraphElement & { label: string };
      const id = 'node1';
      const element: CustomElement = {
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        label: 'Test',
      };

      const customSelector = (options: ElementToGraphOptions<CustomElement>) => {
        return options.defaultAttributes();
      };

      const defaultAttributes = createDefaultElementMapper(id, element);
      const result = customSelector({ id, data: element, graph, defaultAttributes });

      expect(result.data).toEqual({ label: 'Test' });
      expect(result.position).toEqual({ x: 100, y: 50 });
    });

    it('should allow modifying defaultAttributes result', () => {
      type CustomElement = GraphElement & { label: string };
      const id = 'node1';
      const element: CustomElement = {
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        label: 'Test',
      };

      const customSelector = (options: ElementToGraphOptions<CustomElement>) => {
        const base = options.defaultAttributes();
        base.attrs = { root: { fill: 'red' } };
        return base;
      };

      const defaultAttributes = createDefaultElementMapper(id, element);
      const result = customSelector({ id, data: element, graph, defaultAttributes });

      expect(result.attrs).toEqual({ root: { fill: 'red' } });
      expect(result.data).toEqual({ label: 'Test' });
    });

    it('should allow custom selector to ignore defaultAttributes and return custom result', () => {
      type CustomElement = GraphElement & { label: string };
      const id = 'node1';
      const element: CustomElement = {
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        label: 'Test',
      };

      const customSelector = (options: ElementToGraphOptions<CustomElement>) => {
        // Ignore defaultAttributes and return completely custom result
        return {
          id: options.id,
          type: 'custom.Element',
          customData: { label: options.data.label },
        };
      };

      const defaultAttributes = createDefaultElementMapper(id, element);
      const result = customSelector({ id, data: element, graph, defaultAttributes });

      expect(result.type).toBe('custom.Element');
      expect(result.customData).toEqual({ label: 'Test' });
      expect(result).not.toHaveProperty('position');
      expect(result).not.toHaveProperty('data');
    });

    it('should allow custom link selector to use defaultAttributes', () => {
      type CustomLink = GraphLink & { weight: number };
      const id = 'link1';
      const data: CustomLink = {
        source: 'node1',
        target: 'node2',
        weight: 5,
      };

      const customSelector = (options: LinkToGraphOptions<CustomLink>) => {
        return options.defaultAttributes();
      };

      const defaultAttributes = createDefaultLinkMapper(id, data, graph);
      const result = customSelector({ id, data, graph, defaultAttributes });

      // Theme properties are now stored in data for sync purposes
      expect(result.data).toEqual({
        weight: 5,
        color: '#333333',
        width: 2,
        sourceMarker: 'none',
        targetMarker: 'none',
        className: '',
        pattern: '',
      });
      expect(result.source).toEqual({ id: 'node1' });
      expect(result.target).toEqual({ id: 'node2' });
    });

    it('should allow custom link selector to modify defaultAttributes result', () => {
      type CustomLink = GraphLink & { weight: number };
      const id = 'link1';
      const data: CustomLink = {
        source: 'node1',
        target: 'node2',
        weight: 5,
      };

      const customSelector = (options: LinkToGraphOptions<CustomLink>) => {
        const base = options.defaultAttributes();
        base.attrs = { line: { stroke: 'blue', strokeWidth: 2 } };
        return base;
      };

      const defaultAttributes = createDefaultLinkMapper(id, data, graph);
      const result = customSelector({ id, data, graph, defaultAttributes });

      expect(result.attrs).toEqual({ line: { stroke: 'blue', strokeWidth: 2 } });
      // Theme properties are now stored in data for sync purposes
      expect(result.data).toEqual({
        weight: 5,
        color: '#333333',
        width: 2,
        sourceMarker: 'none',
        targetMarker: 'none',
        className: '',
        pattern: '',
      });
    });
  });
});
