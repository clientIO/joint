/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/no-alphabetical-sort */
import { dia, shapes } from '@joint/core';
import { ReactElement } from '../../models/react-element';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import {
  defaultElementFromGraphSelector,
  defaultElementToGraphSelector,
  defaultLinkFromGraphSelector,
  defaultLinkToGraphSelector,
  type ElementFromGraphOptions,
  type ElementToGraphOptions,
  type LinkFromGraphOptions,
  type LinkToGraphOptions,
} from '../graph-state-selectors';

const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };

describe('graph-state-selectors', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  });

  afterEach(() => {
    graph.clear();
  });

  describe('defaultElementToGraphSelector', () => {
    it('should map element to graph cell JSON', () => {
      const element: GraphElement = {
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      };

      const options: ElementToGraphOptions<GraphElement> = {
        element,
        graph,
      };

      const elementAsGraphJson = defaultElementToGraphSelector(options);

      expect(elementAsGraphJson).toMatchObject({
        id: 'element-1',
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });

      // Round-trip: element → graph → element
      graph.syncCells([elementAsGraphJson], { remove: true });

      const elementFromGraph = defaultElementFromGraphSelector({
        cell: graph.getCell('element-1') as dia.Element<dia.Element.Attributes>,
        graph,
      });

      expect(elementFromGraph).toMatchObject({
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });

    it('should handle element without type (defaults to REACT_TYPE)', () => {
      const element: GraphElement = {
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      };

      const options: ElementToGraphOptions<GraphElement> = {
        element,
        graph,
      };

      const elementAsGraphJson = defaultElementToGraphSelector(options);

      expect(elementAsGraphJson.type).toBe('ReactElement');

      // Round-trip: element → graph → element
      graph.syncCells([elementAsGraphJson], { remove: true });

      const elementFromGraph = defaultElementFromGraphSelector({
        cell: graph.getCell('element-1') as dia.Element<dia.Element.Attributes>,
        graph,
      });

      expect(elementFromGraph).toMatchObject({
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });

    it('should preserve all element properties', () => {
      const element: GraphElement = {
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
        ports: { items: [] },
        angle: 45,
      };

      const options: ElementToGraphOptions<GraphElement> = {
        element,
        graph,
      };

      const elementAsGraphJson = defaultElementToGraphSelector(options);

      expect(elementAsGraphJson).toMatchObject({
        id: 'element-1',
        ports: { items: [] },
        angle: 45,
      });

      // Round-trip: element → graph → element
      graph.syncCells([elementAsGraphJson], { remove: true });

      const elementFromGraph = defaultElementFromGraphSelector({
        cell: graph.getCell('element-1') as dia.Element<dia.Element.Attributes>,
        graph,
      });

      expect(elementFromGraph).toMatchObject({
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        ports: { items: [] },
        angle: 45,
      });
    });
  });

  describe('defaultElementFromGraphSelector', () => {
    it('should map graph cell to element without previous state', () => {
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      const options: ElementFromGraphOptions<GraphElement> = {
        cell,
        graph,
      };

      const elementFromGraph = defaultElementFromGraphSelector(options);

      expect(elementFromGraph).toMatchObject({
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });

      // Round-trip: element → graph → element
      const recreatedElementAsGraphJson = defaultElementToGraphSelector({
        element: elementFromGraph,
        graph,
      });
      graph.clear();
      graph.syncCells([recreatedElementAsGraphJson], { remove: true });

      const elementFromRoundTrip = defaultElementFromGraphSelector({
        cell: graph.getCell('element-1') as dia.Element<dia.Element.Attributes>,
        graph,
      });

      expect(elementFromRoundTrip).toMatchObject({
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });

    it('should map graph cell to element with previous state, filtering properties', () => {
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        customProp: 'from-graph',
        extraProp: 'should-be-filtered',
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      type ExtendedElement = GraphElement & {
        customProp?: string;
        extraProp?: string;
      };

      const previous: ExtendedElement = {
        id: 'element-1',
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        customProp: undefined,
        // extraProp is not in previous, so it should be filtered out
      };

      const options: ElementFromGraphOptions<ExtendedElement> = {
        cell,
        graph,
        previous,
      };

      const result = defaultElementFromGraphSelector(options);

      // Should only include properties that exist in previous state
      expect(result).toMatchObject({
        id: 'element-1',
        x: 10, // Updated from graph
        y: 20, // Updated from graph
        width: 100, // Updated from graph
        height: 50, // Updated from graph
        customProp: 'from-graph', // Updated from graph
      });

      // Should NOT include extraProp because it doesn't exist in previous state
      expect(result).not.toHaveProperty('extraProp');
    });

    it('should preserve undefined properties from previous state', () => {
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
        id: 'element-1',
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        customProp: undefined, // Explicitly undefined in previous
      };

      const options: ElementFromGraphOptions<ExtendedElement> = {
        cell,
        graph,
        previous,
      };

      const result = defaultElementFromGraphSelector(options);

      // Should include customProp even though it's undefined in previous
      expect(result).toHaveProperty('customProp');
      expect((result as ExtendedElement).customProp).toBeUndefined();
    });

    it('should handle element with non-REACT_TYPE', () => {
      const elementAsGraphJson = {
        type: 'standard.Rectangle',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      const options: ElementFromGraphOptions<GraphElement> = {
        cell,
        graph,
      };

      const elementFromGraph = defaultElementFromGraphSelector(options);

      expect(elementFromGraph.type).toBe('standard.Rectangle');
    });

    it('should extract ports from cell', () => {
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

      const options: ElementFromGraphOptions<GraphElement> = {
        cell,
        graph,
      };

      const result = defaultElementFromGraphSelector(options);

      expect(result.ports).toEqual(ports);
    });
  });

  describe('defaultLinkToGraphSelector', () => {
    it('should map link to graph cell JSON', () => {
      const link: GraphLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
      };

      const options: LinkToGraphOptions<GraphLink> = {
        link,
        graph,
      };

      const linkAsGraphJson = defaultLinkToGraphSelector(options);

      expect(linkAsGraphJson).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
      });

      // Round-trip: link → graph → link
      graph.syncCells([linkAsGraphJson], { remove: true });

      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graph.getCell('link-1') as dia.Link<dia.Link.Attributes>,
        graph,
      });

      expect(linkFromGraph).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
      });
    });

    it('should handle link with object source and target', () => {
      const link: GraphLink = {
        id: 'link-1',
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: 'standard.Link',
      };

      const options: LinkToGraphOptions<GraphLink> = {
        link,
        graph,
      };

      const linkAsGraphJson = defaultLinkToGraphSelector(options);

      expect(linkAsGraphJson).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: 'standard.Link',
      });

      // Round-trip: link → graph → link
      graph.syncCells([linkAsGraphJson], { remove: true });

      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graph.getCell('link-1') as dia.Link<dia.Link.Attributes>,
        graph,
      });

      expect(linkFromGraph).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        type: 'standard.Link',
      });
    });

    it('should merge attrs with defaults from cell namespace', () => {
      const link: GraphLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        attrs: {
          line: {
            stroke: 'red',
          },
        },
      };

      const options: LinkToGraphOptions<GraphLink> = {
        link,
        graph,
      };

      const linkAsGraphJson = defaultLinkToGraphSelector(options);

      expect(linkAsGraphJson.attrs).toBeDefined();
      expect(linkAsGraphJson.attrs?.line?.stroke).toBe('red');
    });

    it('should preserve all link properties', () => {
      const link: GraphLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 10,
        markup: [{ tagName: 'path' }],
        defaultLabel: { markup: [{ tagName: 'text' }] },
      };

      const options: LinkToGraphOptions<GraphLink> = {
        link,
        graph,
      };

      const linkAsGraphJson = defaultLinkToGraphSelector(options);

      expect(linkAsGraphJson).toMatchObject({
        id: 'link-1',
        z: 10,
        markup: [{ tagName: 'path' }],
        defaultLabel: { markup: [{ tagName: 'text' }] },
      });
    });
  });

  describe('defaultLinkFromGraphSelector', () => {
    it('should map graph link to link without previous state', () => {
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        z: 5,
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const link = graph.getCell('link-1') as dia.Link;

      const options: LinkFromGraphOptions<GraphLink> = {
        cell: link,
        graph,
      };

      const linkFromGraph = defaultLinkFromGraphSelector(options);

      expect(linkFromGraph).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 5,
      });
    });

    it('should map graph link to link with previous state, filtering properties', () => {
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
        z: 5,
        customProp: 'from-graph',
        extraProp: 'should-be-filtered',
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const link = graph.getCell('link-1') as dia.Link;

      type ExtendedLink = GraphLink & {
        customProp?: string;
        extraProp?: string;
      };

      const previous: ExtendedLink = {
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 3,
        customProp: undefined,
        // extraProp is not in previous, so it should be filtered out
      };

      const options: LinkFromGraphOptions<ExtendedLink> = {
        cell: link,
        graph,
        previous,
      };

      const linkFromGraph = defaultLinkFromGraphSelector(options);

      // Should only include properties that exist in previous state
      expect(linkFromGraph).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 5, // Updated from graph
        customProp: 'from-graph', // Updated from graph
      });

      // Should NOT include extraProp because it doesn't exist in previous state
      expect(linkFromGraph).not.toHaveProperty('extraProp');
    });

    it('should preserve undefined properties from previous state', () => {
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        id: 'link-1',
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const link = graph.getCell('link-1') as dia.Link;

      type ExtendedLink = GraphLink & {
        customProp?: string;
      };

      const previous: ExtendedLink = {
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        customProp: undefined, // Explicitly undefined in previous
      };

      const options: LinkFromGraphOptions<ExtendedLink> = {
        cell: link,
        graph,
        previous,
      };

      const linkFromGraph = defaultLinkFromGraphSelector(options);

      // Should include customProp even though it's undefined in previous
      expect(linkFromGraph).toHaveProperty('customProp');
      expect((linkFromGraph as ExtendedLink).customProp).toBeUndefined();
    });

    it('should extract source and target from cell', () => {
      const linkAsGraphJson = {
        type: 'standard.Link',
        source: { id: 'element-1', port: 'port-1' },
        target: { id: 'element-2', port: 'port-2' },
        id: 'link-1',
      } as dia.Cell.JSON;
      graph.syncCells([linkAsGraphJson], { remove: true });
      const link = graph.getCell('link-1') as dia.Link;

      const options: LinkFromGraphOptions<GraphLink> = {
        cell: link,
        graph,
      };

      const linkFromGraph = defaultLinkFromGraphSelector(options);

      expect(linkFromGraph.source).toEqual({ id: 'element-1', port: 'port-1' });
      expect(linkFromGraph.target).toEqual({ id: 'element-2', port: 'port-2' });
    });

    it('should extract z, markup, and defaultLabel from cell', () => {
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
      const link = graph.getCell('link-1') as dia.Link;

      const options: LinkFromGraphOptions<GraphLink> = {
        cell: link,
        graph,
      };

      const linkFromGraph = defaultLinkFromGraphSelector(options);

      expect(linkFromGraph.z).toBe(10);
      expect(linkFromGraph.markup).toEqual([{ tagName: 'path' }]);
      expect(linkFromGraph.defaultLabel).toEqual({ markup: [{ tagName: 'text' }] });
    });

    it('should include all cell attributes when no previous state', () => {
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
      const link = graph.getCell('link-1') as dia.Link;

      const options: LinkFromGraphOptions<GraphLink> = {
        cell: link,
        graph,
      };

      const linkFromGraph = defaultLinkFromGraphSelector(options);

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
      // Create element in graph with extra properties
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        graphOnlyProp: 'should-not-appear',
        anotherGraphProp: 'also-should-not-appear',
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      // Previous state only has specific properties
      const previous: GraphElement = {
        id: 'element-1',
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        // graphOnlyProp and anotherGraphProp are NOT in previous state
      };

      const options: ElementFromGraphOptions<GraphElement> = {
        cell,
        graph,
        previous,
      };

      const elementFromGraph = defaultElementFromGraphSelector(options);

      // Should only have properties from previous state
      expect(elementFromGraph).not.toHaveProperty('graphOnlyProp');
      expect(elementFromGraph).not.toHaveProperty('anotherGraphProp');
      expect(Object.keys(elementFromGraph).sort()).toEqual(
        ['id', 'x', 'y', 'width', 'height'].sort()
      );
    });

    it('should update existing properties from graph even if undefined in previous', () => {
      const elementAsGraphJson = {
        type: 'ReactElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        id: 'element-1',
        customProp: 'updated-value',
      } as dia.Cell.JSON;
      graph.syncCells([elementAsGraphJson], { remove: true });
      const cell = graph.getCell('element-1') as dia.Element;

      type ExtendedElement = GraphElement & {
        customProp?: string;
      };

      const previous: ExtendedElement = {
        id: 'element-1',
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        customProp: undefined, // Exists but undefined
      };

      const options: ElementFromGraphOptions<ExtendedElement> = {
        cell,
        graph,
        previous,
      };

      const elementFromGraph = defaultElementFromGraphSelector(options);

      // Should update customProp from graph
      expect((elementFromGraph as ExtendedElement).customProp).toBe('updated-value');
    });
  });

  describe('integration: links with syncCells', () => {
    it('should handle link round-trip using syncCells', () => {
      const link: GraphLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 5,
      };

      // Convert link to graph JSON
      const linkAsGraphJson = defaultLinkToGraphSelector({
        link,
        graph,
      });

      // Store in graph using syncCells
      graph.syncCells([linkAsGraphJson], { remove: true });

      // Retrieve from graph
      const graphLink = graph.getCell('link-1') as dia.Link;
      expect(graphLink).toBeDefined();

      // Convert back to link
      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graphLink,
        graph,
      });

      expect(linkFromGraph).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 5,
      });
    });

    it('should handle link with complex properties using syncCells', () => {
      const link: GraphLink = {
        id: 'link-1',
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

      const linkAsGraphJson = defaultLinkToGraphSelector({
        link,
        graph,
      });

      graph.syncCells([linkAsGraphJson], { remove: true });

      const graphLink = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graphLink,
        graph,
      });

      expect(linkFromGraph).toMatchObject({
        id: 'link-1',
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

      const link: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 5,
        customProp: 'value-from-state',
        extraProp: 'should-be-filtered',
        anotherProp: 42,
      };

      const linkAsGraphJson = defaultLinkToGraphSelector({
        link,
        graph,
      });

      // Add extra properties to graph JSON that don't exist in state
      const linkWithExtraProps = {
        ...linkAsGraphJson,
        graphOnlyProp: 'should-not-appear',
        anotherGraphProp: 'also-should-not-appear',
      };

      graph.syncCells([linkWithExtraProps], { remove: true });

      const previous: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 3,
        customProp: undefined,
        anotherProp: 0,
        // extraProp is not in previous, so it should be filtered out
      };

      const graphLink = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graphLink,
        graph,
        previous,
      });

      // Should only include properties that exist in previous state
      expect(linkFromGraph).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 5, // Updated from graph
        customProp: 'value-from-state', // From graph
        anotherProp: 42, // Updated from graph
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

      const links: ExtendedLink[] = [
        {
          id: 'link-1',
          source: 'element-1',
          target: 'element-2',
          type: 'standard.Link',
          z: 1,
          label: 'Link 1',
        },
        {
          id: 'link-2',
          source: 'element-2',
          target: 'element-3',
          type: 'standard.Link',
          z: 2,
          metadata: { key: 'value' },
        },
      ];

      const linksAsGraphJson = links.map((link) =>
        defaultLinkToGraphSelector({
          link,
          graph,
        })
      );

      graph.syncCells(linksAsGraphJson, { remove: true });

      // Previous state only has specific properties for each link
      const previousLinks: ExtendedLink[] = [
        {
          id: 'link-1',
          source: 'element-1',
          target: 'element-2',
          type: 'standard.Link',
          z: 0, // Exists in previous
          label: undefined, // Exists but undefined
        },
        {
          id: 'link-2',
          source: 'element-2',
          target: 'element-3',
          type: 'standard.Link',
          z: 0, // Exists in previous
          metadata: undefined, // Exists but undefined
        },
      ];

      const retrievedLinks = graph.getLinks().map((graphLink) => {
        const previous = previousLinks.find((l) => l.id === graphLink.id);
        return defaultLinkFromGraphSelector({
          cell: graphLink,
          graph,
          previous,
        });
      });

      expect(retrievedLinks).toHaveLength(2);

      const link1 = retrievedLinks.find((l) => l.id === 'link-1');
      expect(link1).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        z: 1, // Updated from graph
        label: 'Link 1', // Updated from graph
      });
      expect(link1).not.toHaveProperty('metadata');

      const link2 = retrievedLinks.find((l) => l.id === 'link-2');
      expect(link2).toMatchObject({
        id: 'link-2',
        source: { id: 'element-2' },
        target: { id: 'element-3' },
        type: 'standard.Link',
        z: 2, // Updated from graph
        metadata: { key: 'value' }, // Updated from graph
      });
      expect(link2).not.toHaveProperty('label');
    });

    it('should preserve undefined properties from previous state when using syncCells', () => {
      type ExtendedLink = GraphLink & {
        optionalProp?: string;
        anotherOptionalProp?: number;
      };

      const link: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        optionalProp: 'has-value',
      };

      const linkAsGraphJson = defaultLinkToGraphSelector({
        link,
        graph,
      });

      graph.syncCells([linkAsGraphJson], { remove: true });

      const previous: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        optionalProp: undefined, // Explicitly undefined
        anotherOptionalProp: undefined, // Explicitly undefined
      };

      const graphLink = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graphLink,
        graph,
        previous,
      });

      // Should include optionalProp with value from graph
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

      // Initial link
      const initialLink: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        status: 'active',
        weight: 1,
      };

      const initialLinkAsGraphJson = defaultLinkToGraphSelector({
        link: initialLink,
        graph,
      });

      graph.syncCells([initialLinkAsGraphJson], { remove: true });

      // Update link with new values
      const updatedLink: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        status: 'inactive',
        weight: 2,
        newProp: 'should-be-filtered',
      };

      const updatedLinkAsGraphJson = defaultLinkToGraphSelector({
        link: updatedLink,
        graph,
      });

      graph.syncCells([updatedLinkAsGraphJson], { remove: true });

      // Previous state only has status and weight
      const previous: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        status: 'active',
        weight: 1,
      };

      const graphLink = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graphLink,
        graph,
        previous,
      });

      // Should only include properties from previous state
      expect(linkFromGraph).toMatchObject({
        id: 'link-1',
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        type: 'standard.Link',
        status: 'inactive', // Updated from graph
        weight: 2, // Updated from graph
      });

      // Should NOT include newProp
      expect(linkFromGraph).not.toHaveProperty('newProp');
    });

    it('should handle link with attrs merging when using syncCells', () => {
      const link: GraphLink = {
        id: 'link-1',
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

      const linkAsGraphJson = defaultLinkToGraphSelector({
        link,
        graph,
      });

      graph.syncCells([linkAsGraphJson], { remove: true });

      const graphLink = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graphLink,
        graph,
      });

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

      // Create element in graph with new properties
      const element: ExtendedElement = {
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        newProperty: 'value-from-graph',
        anotherNewProperty: 42,
      };

      const elementAsGraphJson = defaultElementToGraphSelector({
        element,
        graph,
      });

      graph.syncCells([elementAsGraphJson], { remove: true });

      // Previous state has newProperty defined (but undefined) and anotherNewProperty defined
      const previous: ExtendedElement = {
        id: 'element-1',
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        newProperty: undefined, // Defined in state type but undefined
        anotherNewProperty: 0, // Defined in state type with initial value
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = defaultElementFromGraphSelector({
        cell: graphElement,
        graph,
        previous,
      });

      // Should return newProperty with value from graph
      expect((elementFromGraph as ExtendedElement).newProperty).toBe('value-from-graph');
      // Should return anotherNewProperty with value from graph
      expect((elementFromGraph as ExtendedElement).anotherNewProperty).toBe(42);
    });

    it('should return new link property when it exists in previous state (even if undefined)', () => {
      type ExtendedLink = GraphLink & {
        newLinkProperty?: string;
        priority?: number;
        metadata?: Record<string, unknown>;
      };

      // Create link in graph with new properties
      const link: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        newLinkProperty: 'value-from-graph',
        // @ts-expect-error - priority is not defined in the state type
        priority: 10,
        metadata: { key: 'value' },
      };

      const linkAsGraphJson = defaultLinkToGraphSelector({
        link,
        graph,
      });

      graph.syncCells([linkAsGraphJson], { remove: true });

      // Previous state has all properties defined (some undefined)
      const previous: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        newLinkProperty: undefined, // Defined in state type but undefined
        priority: undefined, // Defined in state type but undefined
        metadata: undefined, // Defined in state type but undefined
      };

      const graphLink = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graphLink,
        graph,
        previous,
      });

      // Should return all properties with values from graph
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

      const element: ExtendedElement = {
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        status: 'active',
        category: 'type-a',
        tags: ['tag1', 'tag2'],
        score: 95,
      };

      const elementAsGraphJson = defaultElementToGraphSelector({
        element,
        graph,
      });

      graph.syncCells([elementAsGraphJson], { remove: true });

      // Previous state defines all properties (some undefined)
      const previous: ExtendedElement = {
        id: 'element-1',
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
      const elementFromGraph = defaultElementFromGraphSelector({
        cell: graphElement,
        graph,
        previous,
      });

      // All properties should be returned with values from graph
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

      const link: ExtendedLink = {
        id: 'link-1',
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

      const linkAsGraphJson = defaultLinkToGraphSelector({
        link,
        graph,
      });

      graph.syncCells([linkAsGraphJson], { remove: true });

      // Previous state defines all properties (all undefined)
      const previous: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        config: undefined,
        labels: undefined,
        customData: undefined,
      };

      const graphLink = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graphLink,
        graph,
        previous,
      });

      // All complex properties should be returned with values from graph
      expect((linkFromGraph as ExtendedLink).config).toEqual({
        style: 'dashed',
        animation: true,
      });
      expect((linkFromGraph as ExtendedLink).labels).toEqual([
        { text: 'Label 1', position: 0.3 },
        { text: 'Label 2', position: 0.7 },
      ]);
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

      const element: ExtendedElement = {
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        definedProperty: 'value-1',
        undefinedProperty: 100,
        notInPreviousProperty: true,
      };

      const elementAsGraphJson = defaultElementToGraphSelector({
        element,
        graph,
      });

      graph.syncCells([elementAsGraphJson], { remove: true });

      // Previous state only defines some properties
      const previous: ExtendedElement = {
        id: 'element-1',
        x: 5,
        y: 15,
        width: 80,
        height: 40,
        definedProperty: undefined, // Defined in previous
        undefinedProperty: undefined, // Defined in previous
        // notInPreviousProperty is NOT in previous
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = defaultElementFromGraphSelector({
        cell: graphElement,
        graph,
        previous,
      });

      // Properties defined in previous should be returned
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

      const link: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 5, // Existing GraphLink property
        markup: [{ tagName: 'path' }], // Existing GraphLink property
        customLabel: 'Custom', // New property
        weight: 10, // New property
      };

      const linkAsGraphJson = defaultLinkToGraphSelector({
        link,
        graph,
      });

      graph.syncCells([linkAsGraphJson], { remove: true });

      // Previous state has both existing and new properties
      const previous: ExtendedLink = {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'standard.Link',
        z: 3, // Existing property
        customLabel: undefined, // New property defined
        weight: undefined, // New property defined
      };

      const graphLink = graph.getCell('link-1') as dia.Link;
      const linkFromGraph = defaultLinkFromGraphSelector({
        cell: graphLink,
        graph,
        previous,
      });

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

      // Initial element without new properties
      const initialElement: ExtendedElement = {
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      };

      const initialElementAsGraphJson = defaultElementToGraphSelector({
        element: initialElement,
        graph,
      });

      graph.syncCells([initialElementAsGraphJson], { remove: true });

      // Update element with new properties
      const updatedElement: ExtendedElement = {
        id: 'element-1',
        x: 15,
        y: 25,
        width: 120,
        height: 60,
        version: 2,
        lastModified: '2024-01-01',
      };

      const updatedElementAsGraphJson = defaultElementToGraphSelector({
        element: updatedElement,
        graph,
      });

      graph.syncCells([updatedElementAsGraphJson], { remove: true });

      // Previous state now includes the new properties
      const previous: ExtendedElement = {
        id: 'element-1',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        version: undefined,
        lastModified: undefined,
      };

      const graphElement = graph.getCell('element-1') as dia.Element;
      const elementFromGraph = defaultElementFromGraphSelector({
        cell: graphElement,
        graph,
        previous,
      });

      // Should return all properties including new ones
      expect(elementFromGraph.x).toBe(15);
      expect(elementFromGraph.y).toBe(25);
      expect(elementFromGraph.width).toBe(120);
      expect(elementFromGraph.height).toBe(60);
      expect((elementFromGraph as ExtendedElement).version).toBe(2);
      expect((elementFromGraph as ExtendedElement).lastModified).toBe('2024-01-01');
    });
  });
});
