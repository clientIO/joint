/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/no-alphabetical-sort */
import { dia, shapes } from '@joint/core';
import { ReactElement } from '../../models/react-element';
import { ReactLink, REACT_LINK_TYPE } from '../../models/react-link';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  defaultMapElementAttributesToData,
  defaultMapLinkAttributesToData,
} from '../data-mapping';
import type {
  GraphToElementOptions,
  ElementToGraphOptions,
  GraphToLinkOptions,
  LinkToGraphOptions,
} from '../graph-state-selectors';

const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement, ReactLink };

// Helper functions to create options (no more defaultAttributes)
const createElementToGraphOptions = <E extends GraphElement>(
  id: string,
  data: E,
  graph: dia.Graph
): ElementToGraphOptions<E> => ({
  id,
  data,
  graph,
  toAttributes: (newData) => defaultMapDataToElementAttributes({ id, data: newData }),
});

const createGraphToElementOptions = <E extends GraphElement>(
  id: string,
  cell: dia.Element,
  graph: dia.Graph,
  previousData?: E
): GraphToElementOptions<E> => ({
  id,
  cell,
  graph,
  previousData,
  toData: () => defaultMapElementAttributesToData({ cell }),
});

const createLinkToGraphOptions = <L extends GraphLink>(
  id: string,
  data: L,
  graph: dia.Graph
): LinkToGraphOptions<L> => ({
  id,
  data,
  graph,
  toAttributes: (newData) => defaultMapDataToLinkAttributes({ id, data: newData }),
});

const createGraphToLinkOptions = <L extends GraphLink>(
  id: string,
  cell: dia.Link,
  graph: dia.Graph,
  previousData?: L
): GraphToLinkOptions<L> => ({
  id,
  cell,
  graph,
  previousData,
  toData: () => defaultMapLinkAttributesToData({ cell }),
});

describe('graph-state-selectors', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  });

  afterEach(() => {
    graph.clear();
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
      graph.addCell(elementAsGraphJson);

      const cell = graph.getCell('element-1') as dia.Element<dia.Element.Attributes>;
      const elementFromGraph = defaultMapElementAttributesToData(
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
      graph.addCell(elementAsGraphJson);

      const cell = graph.getCell('element-1') as dia.Element<dia.Element.Attributes>;
      const elementFromGraph = defaultMapElementAttributesToData(
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
        ports: [],
        angle: 45,
      };

      const options = createElementToGraphOptions(id, data, graph);

      const elementAsGraphJson = defaultMapDataToElementAttributes(options);

      expect(elementAsGraphJson).toMatchObject({
        id: 'element-1',
        ports: { groups: { main: { position: { name: 'absolute' } } }, items: [] },
        angle: 45,
      });

      // Round-trip: element → graph → element
      graph.addCell(elementAsGraphJson);

      const cell = graph.getCell('element-1') as dia.Element<dia.Element.Attributes>;
      const elementFromGraph = defaultMapElementAttributesToData(
        createGraphToElementOptions(id, cell, graph)
      );

      expect(elementFromGraph).toMatchObject({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        angle: 45,
      });
      // ports is one-way (consumed during forward mapping only), not returned by reverse mapper
      expect(elementFromGraph).not.toHaveProperty('ports');
    });
  });

  describe('defaultMapElementAttributesToData', () => {
    it('should map graph cell to element without previousData state', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
      } as dia.Cell.JSON;
      graph.addCell(elementAsGraphJson);
      const cell = graph.getCell('element-1') as dia.Element;

      const options = createGraphToElementOptions(id, cell, graph);

      const elementFromGraph = defaultMapElementAttributesToData(options);

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
      graph.addCell(recreatedElementAsGraphJson);

      const roundTripCell = graph.getCell('element-1') as dia.Element<dia.Element.Attributes>;
      const elementFromRoundTrip = defaultMapElementAttributesToData(
        createGraphToElementOptions(id, roundTripCell, graph)
      );

      expect(elementFromRoundTrip).toMatchObject({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });

    it('should include all cell.data properties regardless of previousData', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        data: { customProp: 'from-graph', extraProp: 'also-included' },
      } as dia.Cell.JSON;
      graph.addCell(elementAsGraphJson);
      const cell = graph.getCell('element-1') as dia.Element;

      type ExtendedElement = GraphElement & {
        customProp?: string;
        extraProp?: string;
      };

      const previousData: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        customProp: undefined,
      };

      const options = createGraphToElementOptions(id, cell, graph, previousData);

      const result = defaultMapElementAttributesToData(options);

      // previousData is passed through but the default mapper does not filter by it
      expect(result).toMatchObject({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        customProp: 'from-graph',
      });

      // Default mapper spreads all cell.data — no filtering
      expect(result).toHaveProperty('extraProp', 'also-included');
    });

    it('should not include properties that are not in cell.data even if in previousData', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        // No data property — customProp was never stored in cell.data
      } as dia.Cell.JSON;
      graph.addCell(elementAsGraphJson);
      const cell = graph.getCell('element-1') as dia.Element;

      type ExtendedElement = GraphElement & {
        customProp?: string;
      };

      const previousData: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        customProp: undefined,
      };

      const options = createGraphToElementOptions(id, cell, graph, previousData);

      const result = defaultMapElementAttributesToData(options);

      // Default mapper does not use previousData — only returns what's in cell.attributes + cell.data
      // customProp was never stored in cell.data, so it won't appear
      expect(result).not.toHaveProperty('customProp');
    });

    it('should handle element with non-REACT_TYPE', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'standard.Rectangle',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
      } as dia.Cell.JSON;
      graph.addCell(elementAsGraphJson);
      const cell = graph.getCell('element-1') as dia.Element;

      const options = createGraphToElementOptions(id, cell, graph);

      const elementFromGraph = defaultMapElementAttributesToData(options);

      expect(elementFromGraph.type).toBeUndefined();
    });

    it('should not extract ports from cell (ports is one-way)', () => {
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
      graph.addCell(elementAsGraphJson);
      const cell = graph.getCell('element-1') as dia.Element;

      const options = createGraphToElementOptions(id, cell, graph);

      const result = defaultMapElementAttributesToData(options);

      // ports is one-way (consumed during forward mapping only), not returned by reverse mapper
      expect(result).not.toHaveProperty('ports');
    });
  });

  describe('defaultMapDataToLinkAttributes', () => {
    it('should map link to graph cell JSON', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
      };

      const options = createLinkToGraphOptions(id, link, graph);

      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: REACT_LINK_TYPE,
      });

      // Round-trip: link → graph → link
      graph.addCell(linkAsGraphJson);

      const linkCell = graph.getCell('link-1') as dia.Link<dia.Link.Attributes>;
      const linkFromGraph = defaultMapLinkAttributesToData(createGraphToLinkOptions(id, linkCell, graph));

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: REACT_LINK_TYPE,
      });
    });

    it('should handle link with object source and target', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: REACT_LINK_TYPE,
      };

      const options = createLinkToGraphOptions(id, link, graph);

      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: REACT_LINK_TYPE,
      });

      // Round-trip: link → graph → link
      graph.addCell(linkAsGraphJson);

      const linkCell = graph.getCell('link-1') as dia.Link<dia.Link.Attributes>;
      const linkFromGraph = defaultMapLinkAttributesToData(createGraphToLinkOptions(id, linkCell, graph));

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: REACT_LINK_TYPE,
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

    it('should explicitly set targetMarker to null in line attrs when set to none', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        targetMarker: 'none',
      };

      const options = createLinkToGraphOptions(id, link, graph);
      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson.attrs?.line?.targetMarker).toBeNull();
    });

    it('should normalize custom targetMarker with only d to path marker', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        targetMarker: { d: 'M 0 0 7 5 7 -5' } as dia.SVGMarkerJSON,
      };

      const options = createLinkToGraphOptions(id, link, graph);
      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson.attrs?.line?.targetMarker).toMatchObject({
        type: 'path',
        d: 'M 0 0 7 5 7 -5',
      });
    });

    it('should not include sourceMarker in line attrs when set to none', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        sourceMarker: 'none',
      };

      const options = createLinkToGraphOptions(id, link, graph);
      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson.attrs?.line).not.toHaveProperty('sourceMarker');
    });

    it('should hide default targetMarker after round-trip through graph when set to none', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        targetMarker: 'none',
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, link, graph)
      );
      graph.addCell(linkAsGraphJson);

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const lineAttrs = graphLinkCell.attr('line');

      // After syncing to graph, the ReactLink default targetMarker should be overridden
      expect(lineAttrs.targetMarker).toBeNull();
    });

    it('should preserve all link properties', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        z: 10,
      };

      const options = createLinkToGraphOptions(id, link, graph);

      const linkAsGraphJson = defaultMapDataToLinkAttributes(options);

      expect(linkAsGraphJson).toMatchObject({
        id: 'link-1',
        z: 10,
      });
      // type goes to cell.data as user data (not a two-way prop)
      expect(linkAsGraphJson.data).toMatchObject({ type: REACT_LINK_TYPE });
    });
  });

  describe('defaultMapLinkAttributesToData', () => {
    it('should map graph link to link without previousData state', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: REACT_LINK_TYPE,
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        z: 5,
      } as dia.Cell.JSON;
      graph.addCell(linkAsGraphJson);
      const linkCell = graph.getCell('link-1') as dia.Link;

      const options = createGraphToLinkOptions(id, linkCell, graph);

      const linkFromGraph = defaultMapLinkAttributesToData(options);

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        z: 5,
      });
      // Internal JointJS properties are not mapped back
      expect(linkFromGraph).not.toHaveProperty('type');
    });

    it('should include all cell.data properties regardless of previousData', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: REACT_LINK_TYPE,
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        z: 5,
        data: { customProp: 'from-graph', extraProp: 'also-included' },
      } as dia.Cell.JSON;
      graph.addCell(linkAsGraphJson);
      const linkCell = graph.getCell('link-1') as dia.Link;

      type ExtendedLink = GraphLink & {
        customProp?: string;
        extraProp?: string;
      };

      const previousData: ExtendedLink = {
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        z: 3,
        customProp: undefined,
      };

      const options = createGraphToLinkOptions(id, linkCell, graph, previousData);

      const linkFromGraph = defaultMapLinkAttributesToData(options);

      // previousData is passed through but the default mapper does not filter by it
      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        z: 5,
        customProp: 'from-graph',
      });

      // Default mapper spreads all cell.data — no filtering
      expect(linkFromGraph).toHaveProperty('extraProp', 'also-included');
    });

    it('should not include properties that are not in cell.data even if in previousData', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: REACT_LINK_TYPE,
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        // No data property — customProp was never stored in cell.data
      } as dia.Cell.JSON;
      graph.addCell(linkAsGraphJson);
      const linkCell = graph.getCell('link-1') as dia.Link;

      type ExtendedLink = GraphLink & {
        customProp?: string;
      };

      const previousData: ExtendedLink = {
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        customProp: undefined,
      };

      const options = createGraphToLinkOptions(id, linkCell, graph, previousData);

      const linkFromGraph = defaultMapLinkAttributesToData(options);

      // Default mapper does not use previousData — only returns what's in cell.attributes + cell.data
      // customProp was never stored in cell.data, so it won't appear
      expect(linkFromGraph).not.toHaveProperty('customProp');
    });

    it('should extract source and target from cell', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: REACT_LINK_TYPE,
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        id: 'link-1',
      } as dia.Cell.JSON;
      graph.addCell(linkAsGraphJson);
      const linkCell = graph.getCell('link-1') as dia.Link;

      const options = createGraphToLinkOptions(id, linkCell, graph);

      const linkFromGraph = defaultMapLinkAttributesToData(options);

      expect(linkFromGraph.source).toEqual({ id: 'element-1', port: 'port-1' });
      expect(linkFromGraph.target).toEqual({ id: 'element-2', port: 'port-2' });
    });

    it('should extract z but not markup or defaultLabel from cell', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: REACT_LINK_TYPE,
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        z: 10,
        markup: [{ tagName: 'path' }],
        defaultLabel: { markup: [{ tagName: 'text' }] },
      } as dia.Cell.JSON;
      graph.addCell(linkAsGraphJson);
      const linkCell = graph.getCell('link-1') as dia.Link;

      const options = createGraphToLinkOptions(id, linkCell, graph);

      const linkFromGraph = defaultMapLinkAttributesToData(options);

      // Two-way properties are mapped back
      expect(linkFromGraph.z).toBe(10);
      // Internal JointJS properties are not mapped back
      expect(linkFromGraph).not.toHaveProperty('markup');
      expect(linkFromGraph).not.toHaveProperty('defaultLabel');
    });

    it('should not include internal cell attributes like attrs', () => {
      const id = 'link-1';
      const linkAsGraphJson = {
        type: REACT_LINK_TYPE,
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
      graph.addCell(linkAsGraphJson);
      const linkCell = graph.getCell('link-1') as dia.Link;

      const options = createGraphToLinkOptions(id, linkCell, graph);

      const linkFromGraph = defaultMapLinkAttributesToData(options);

      // Internal JointJS properties are not mapped back
      expect(linkFromGraph).not.toHaveProperty('attrs');
    });
  });

  describe('integration: state is source of truth', () => {
    it('should include all cell.data properties regardless of previousData', () => {
      const id = 'element-1';
      // Create element in graph with extra properties in cell.data
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        data: { graphOnlyProp: 'included', anotherGraphProp: 'also-included' },
      } as dia.Cell.JSON;
      graph.addCell(elementAsGraphJson);
      const cell = graph.getCell('element-1') as dia.Element;

      // previousData state only has specific properties
      const previousData: GraphElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
      };

      const options = createGraphToElementOptions(id, cell, graph, previousData);

      const elementFromGraph = defaultMapElementAttributesToData(options);

      // Default mapper spreads all cell.data — no filtering by previousData
      expect(elementFromGraph).toHaveProperty('graphOnlyProp', 'included');
      expect(elementFromGraph).toHaveProperty('anotherGraphProp', 'also-included');
    });

    it('should update existing properties from graph even if undefined in previousData', () => {
      const id = 'element-1';
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        data: { customProp: 'updated-value' },
      } as dia.Cell.JSON;
      graph.addCell(elementAsGraphJson);
      const cell = graph.getCell('element-1') as dia.Element;

      type ExtendedElement = GraphElement & {
        customProp?: string;
      };

      const previousData: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        customProp: undefined, // Exists but undefined
      };

      const options = createGraphToElementOptions(id, cell, graph, previousData);

      const elementFromGraph = defaultMapElementAttributesToData(options);

      // Should update customProp from graph data
      expect((elementFromGraph as ExtendedElement).customProp).toBe('updated-value');
    });
  });

  describe('integration: links round-trip', () => {
    it('should handle link round-trip', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        z: 5,
      };

      // Convert link to graph JSON
      const linkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, link, graph)
      );

      // Store in graph
      graph.addCell(linkAsGraphJson);

      // Retrieve from graph
      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      expect(graphLinkCell).toBeDefined();

      // Convert back to link
      const linkFromGraph = defaultMapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph)
      );

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: REACT_LINK_TYPE,
        z: 5,
      });
    });

    it('should handle link with complex properties', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: REACT_LINK_TYPE,
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

      const linkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, link, graph)
      );

      graph.addCell(linkAsGraphJson);

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultMapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph)
      );

      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: REACT_LINK_TYPE,
        z: 10,
      });
      expect(linkFromGraph.markup).toEqual([{ tagName: 'path' }]);
      expect(linkFromGraph.defaultLabel).toEqual({ markup: [{ tagName: 'text' }] });
      expect(linkFromGraph.attrs).toBeDefined();
    });

    it('should include all cell.data properties regardless of previousData', () => {
      type ExtendedLink = GraphLink & {
        customProp?: string;
        extraProp?: string;
        anotherProp?: number;
      };

      const id = 'link-1';
      const link: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        z: 5,
        customProp: 'value-from-state',
        extraProp: 'also-included',
        anotherProp: 42,
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, link, graph)
      );

      graph.addCell(linkAsGraphJson);

      const previousData: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        z: 3,
        customProp: undefined,
        anotherProp: 0,
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultMapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previousData)
      );

      // Default mapper spreads all cell.data — no filtering by previousData
      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: REACT_LINK_TYPE,
        z: 5,
        customProp: 'value-from-state',
        anotherProp: 42,
      });

      // extraProp is also in cell.data, so it's included
      expect(linkFromGraph).toHaveProperty('extraProp', 'also-included');
    });

    it('should handle multiple links with previousData state', () => {
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
            type: REACT_LINK_TYPE,
            z: 1,
            label: 'Link 1',
          },
        },
        {
          id: 'link-2',
          data: {
            source: 'element-2',
            target: 'element-3',
            type: REACT_LINK_TYPE,
            z: 2,
            metadata: { key: 'value' },
          },
        },
      ];

      const linksAsGraphJson = links.map(({ id, data }) =>
        defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, data, graph))
      );

      graph.resetCells(linksAsGraphJson);

      // previousData state only has specific properties for each link
      const previousLinks: Array<{ id: string; data: ExtendedLink }> = [
        {
          id: 'link-1',
          data: {
            source: 'element-1',
            target: 'element-2',
            type: REACT_LINK_TYPE,
            z: 0, // Exists in previousData
            label: undefined, // Exists but undefined
          },
        },
        {
          id: 'link-2',
          data: {
            source: 'element-2',
            target: 'element-3',
            type: REACT_LINK_TYPE,
            z: 0, // Exists in previousData
            metadata: undefined, // Exists but undefined
          },
        },
      ];

      const retrievedLinks = graph.getLinks().map((graphLinkCell) => {
        const id = graphLinkCell.id as string;
        const previousData = previousLinks.find((l) => l.id === id)?.data;
        return {
          id,
          data: defaultMapLinkAttributesToData(
            createGraphToLinkOptions(id, graphLinkCell, graph, previousData)
          ),
        };
      });

      expect(retrievedLinks).toHaveLength(2);

      const link1 = retrievedLinks.find((l) => l.id === 'link-1');
      expect(link1?.data).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: REACT_LINK_TYPE,
        z: 1, // Updated from graph
        label: 'Link 1', // Updated from graph data
      });
      expect(link1?.data).not.toHaveProperty('metadata');

      const link2 = retrievedLinks.find((l) => l.id === 'link-2');
      expect(link2?.data).toMatchObject({
        source: { id: 'element-2' },
        target: { id: 'element-3' },
        type: REACT_LINK_TYPE,
        z: 2, // Updated from graph
        metadata: { key: 'value' }, // Updated from graph data
      });
      expect(link2?.data).not.toHaveProperty('label');
    });

    it('should only return properties that exist in cell.data', () => {
      type ExtendedLink = GraphLink & {
        optionalProp?: string;
        anotherOptionalProp?: number;
      };

      const id = 'link-1';
      const link: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        optionalProp: 'has-value',
        // anotherOptionalProp is not set — won't be in cell.data
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, link, graph)
      );

      graph.addCell(linkAsGraphJson);

      const previousData: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        optionalProp: undefined,
        anotherOptionalProp: undefined,
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultMapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previousData)
      );

      // optionalProp was stored in cell.data during forward mapping
      expect((linkFromGraph as ExtendedLink).optionalProp).toBe('has-value');
      // anotherOptionalProp was never stored in cell.data (was not in forward data), so it won't appear
      expect(linkFromGraph).not.toHaveProperty('anotherOptionalProp');
    });

    it('should handle link updates including all cell.data properties', () => {
      type ExtendedLink = GraphLink & {
        status?: string;
        weight?: number;
        newProp?: string;
      };

      const id = 'link-1';
      // Initial link
      const initialLink: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        status: 'active',
        weight: 1,
      };

      const initialLinkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, initialLink, graph)
      );

      graph.addCell(initialLinkAsGraphJson);

      // Update link with new values
      const updatedLink: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        status: 'inactive',
        weight: 2,
        newProp: 'included',
      };

      const updatedLinkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, updatedLink, graph)
      );

      graph.resetCells([updatedLinkAsGraphJson]);

      const previousData: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        status: 'active',
        weight: 1,
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultMapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previousData)
      );

      // Default mapper spreads all cell.data — no filtering by previousData
      expect(linkFromGraph).toMatchObject({
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: REACT_LINK_TYPE,
        status: 'inactive',
        weight: 2,
      });

      // newProp was stored in cell.data during forward mapping, so it's included
      expect(linkFromGraph).toHaveProperty('newProp', 'included');
    });

    it('should handle link with attrs merging', () => {
      const id = 'link-1';
      const link: GraphLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        attrs: {
          line: {
            stroke: 'red',
            strokeWidth: 3,
          },
        },
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, link, graph)
      );

      graph.addCell(linkAsGraphJson);

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultMapLinkAttributesToData(
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
    it('should return new element property when it exists in previousData state (even if undefined)', () => {
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

      graph.addCell(elementAsGraphJson);

      // previousData state has newProperty defined (but undefined) and anotherNewProperty defined
      const previousData: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        newProperty: undefined, // Defined in state type but undefined
        anotherNewProperty: 0, // Defined in state type with initial value
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = defaultMapElementAttributesToData(
        createGraphToElementOptions(id, graphElement, graph, previousData)
      );

      // Should return newProperty with value from graph data
      expect((elementFromGraph as ExtendedElement).newProperty).toBe('value-from-graph');
      // Should return anotherNewProperty with value from graph data
      expect((elementFromGraph as ExtendedElement).anotherNewProperty).toBe(42);
    });

    it('should return new link property when it exists in previousData state (even if undefined)', () => {
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
        type: REACT_LINK_TYPE,
        newLinkProperty: 'value-from-graph',
        priority: 10,
        metadata: { key: 'value' },
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, link, graph)
      );

      graph.addCell(linkAsGraphJson);

      // previousData state has all properties defined (some undefined)
      const previousData: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        newLinkProperty: undefined, // Defined in state type but undefined
        priority: undefined, // Defined in state type but undefined
        metadata: undefined, // Defined in state type but undefined
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultMapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previousData)
      );

      // Should return all properties with values from graph data
      expect((linkFromGraph as ExtendedLink).newLinkProperty).toBe('value-from-graph');
      expect((linkFromGraph as ExtendedLink).priority).toBe(10);
      expect((linkFromGraph as ExtendedLink).metadata).toEqual({ key: 'value' });
    });

    it('should return multiple new element properties when all are defined in previousData state', () => {
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

      graph.addCell(elementAsGraphJson);

      // previousData state defines all properties (some undefined)
      const previousData: ExtendedElement = {
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
      const elementFromGraph = defaultMapElementAttributesToData(
        createGraphToElementOptions(id, graphElement, graph, previousData)
      );

      // All properties should be returned with values from graph data
      expect((elementFromGraph as ExtendedElement).status).toBe('active');
      expect((elementFromGraph as ExtendedElement).category).toBe('type-a');
      expect((elementFromGraph as ExtendedElement).tags).toEqual(['tag1', 'tag2']);
      expect((elementFromGraph as ExtendedElement).score).toBe(95);
    });

    it('should return new link properties with complex nested structures when defined in previousData state', () => {
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
        type: REACT_LINK_TYPE,
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

      const linkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, link, graph)
      );

      graph.addCell(linkAsGraphJson);

      // previousData state defines all properties (all undefined)
      const previousData: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        config: undefined,
        customData: undefined,
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultMapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previousData)
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

    it('should return all cell.data properties regardless of whether they are in previousData', () => {
      type ExtendedElement = GraphElement & {
        definedProperty?: string;
        undefinedProperty?: number;
        notInPreviousDataProperty?: boolean;
      };

      const id = 'element-1';
      const element: ExtendedElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        definedProperty: 'value-1',
        undefinedProperty: 100,
        notInPreviousDataProperty: true,
      };

      const elementAsGraphJson = defaultMapDataToElementAttributes(
        createElementToGraphOptions(id, element, graph)
      );

      graph.addCell(elementAsGraphJson);

      // previousData state only defines some properties
      const previousData: ExtendedElement = {
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        definedProperty: undefined,
        undefinedProperty: undefined,
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = defaultMapElementAttributesToData(
        createGraphToElementOptions(id, graphElement, graph, previousData)
      );

      // All properties from cell.data are returned
      expect((elementFromGraph as ExtendedElement).definedProperty).toBe('value-1');
      expect((elementFromGraph as ExtendedElement).undefinedProperty).toBe(100);

      // Default mapper spreads all cell.data — no filtering by previousData
      expect((elementFromGraph as ExtendedElement).notInPreviousDataProperty).toBe(true);
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
        type: REACT_LINK_TYPE,
        z: 5, // Existing GraphLink property
        markup: [{ tagName: 'path' }], // Existing GraphLink property
        customLabel: 'Custom', // New property
        weight: 10, // New property
      };

      const linkAsGraphJson = defaultMapDataToLinkAttributes(
        createLinkToGraphOptions(id, link, graph)
      );

      graph.addCell(linkAsGraphJson);

      // previousData state has both existing and new properties
      const previousData: ExtendedLink = {
        source: 'element-1',
        target: 'element-2',
        type: REACT_LINK_TYPE,
        z: 3, // Existing property
        customLabel: undefined, // New property defined
        weight: undefined, // New property defined
      };

      const graphLinkCell = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultMapLinkAttributesToData(
        createGraphToLinkOptions(id, graphLinkCell, graph, previousData)
      );

      // All properties should be returned
      expect(linkFromGraph.z).toBe(5); // Updated from graph
      expect((linkFromGraph as ExtendedLink).customLabel).toBe('Custom');
      expect((linkFromGraph as ExtendedLink).weight).toBe(10);
    });

    it('should properly return new properties after element update', () => {
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

      graph.addCell(initialElementAsGraphJson);

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

      graph.resetCells([updatedElementAsGraphJson]);

      // previousData state now includes the new properties
      const previousData: ExtendedElement = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        version: undefined,
        lastModified: undefined,
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = defaultMapElementAttributesToData(
        createGraphToElementOptions(id, graphElement, graph, previousData)
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

  describe('custom selector usage', () => {
    it('should allow using flatMapper functions directly', () => {
      type CustomElement = GraphElement & { label: string };
      const id = 'node1';
      const element: CustomElement = {
        x: 100,
        y: 50,
        width: 200,
        height: 100,
        label: 'Test',
      };

      const result = defaultMapDataToElementAttributes(createElementToGraphOptions(id, element, graph));

      expect(result.data).toEqual({ label: 'Test' });
      expect(result.position).toEqual({ x: 100, y: 50 });
    });

    it('should allow custom selector to modify flatMapper result', () => {
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
        const base = defaultMapDataToElementAttributes(options);
        base.attrs = { root: { fill: 'red' } };
        return base;
      };

      const result = customSelector(createElementToGraphOptions(id, element, graph));

      expect(result.attrs).toEqual({ root: { fill: 'red' } });
      expect(result.data).toEqual({ label: 'Test' });
    });

    it('should allow custom selector to ignore flatMapper and return custom result', () => {
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
        // Ignore flatMapper and return completely custom result
        return {
          id: options.id,
          type: 'custom.Element',
          customData: { label: options.data.label },
        };
      };

      const result = customSelector(createElementToGraphOptions(id, element, graph));

      expect(result.type).toBe('custom.Element');
      expect(result.customData).toEqual({ label: 'Test' });
      expect(result).not.toHaveProperty('position');
      expect(result).not.toHaveProperty('data');
    });

    it('should allow custom link selector to use flatMapper', () => {
      type CustomLink = GraphLink & { weight: number };
      const id = 'link1';
      const data: CustomLink = {
        source: 'node1',
        target: 'node2',
        weight: 5,
      };

      const result = defaultMapDataToLinkAttributes(createLinkToGraphOptions(id, data, graph));

      // Theme properties are now stored in data for sync purposes
      expect(result.data).toEqual({
        weight: 5,
        color: '#333333',
        width: 2,
        sourceMarker: 'none',
        targetMarker: 'none',
        className: '',
        pattern: '',
        lineCap: '',
        lineJoin: '',
        wrapperBuffer: 8,
        wrapperColor: 'transparent',
      });
      expect(result.source).toEqual({ id: 'node1' });
      expect(result.target).toEqual({ id: 'node2' });
    });

    it('should allow custom link selector to modify flatMapper result', () => {
      type CustomLink = GraphLink & { weight: number };
      const id = 'link1';
      const data: CustomLink = {
        source: 'node1',
        target: 'node2',
        weight: 5,
      };

      const customSelector = (options: LinkToGraphOptions<CustomLink>) => {
        const base = defaultMapDataToLinkAttributes(options);
        base.attrs = { line: { stroke: 'blue', strokeWidth: 2 } };
        return base;
      };

      const result = customSelector(createLinkToGraphOptions(id, data, graph));

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
        lineCap: '',
        lineJoin: '',
        wrapperBuffer: 8,
        wrapperColor: 'transparent',
      });
    });
  });
});
