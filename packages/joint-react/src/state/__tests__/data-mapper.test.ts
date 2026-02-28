/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/no-alphabetical-sort */
import { dia, shapes } from '@joint/core';
import { ReactElement } from '../../models/react-element';
import { ReactLink, REACT_LINK_TYPE } from '../../models/react-link';
import type { GraphElement, GraphElementPort } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import type { ElementToGraphOptions, LinkToGraphOptions, GraphToLinkOptions } from '../graph-state-selectors';
import { defaultMapDataToElementAttributes, defaultMapDataToLinkAttributes, defaultMapElementAttributesToData, defaultMapLinkAttributesToData } from '../data-mapping';

const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement, ReactLink };

function elementToGraphOpts(id: string, data: GraphElement, graph: dia.Graph): ElementToGraphOptions<GraphElement> {
  return { id, data, graph, toAttributes: (d) => defaultMapDataToElementAttributes({ id, data: d }) };
}
function graphToElementOpts(id: string, cell: dia.Element, graph: dia.Graph, previousData?: GraphElement) {
  return { id, cell, graph, previousData, toData: () => defaultMapElementAttributesToData({ cell }) };
}
function linkToGraphOpts(id: string, data: GraphLink, graph: dia.Graph): LinkToGraphOptions<GraphLink> {
  return { id, data, graph, toAttributes: (d) => defaultMapDataToLinkAttributes({ id, data: d }) };
}
function graphToLinkOpts(id: string, cell: dia.Link, graph: dia.Graph, previousData?: GraphLink): GraphToLinkOptions<GraphLink> {
  return { id, cell, graph, previousData, toData: () => defaultMapLinkAttributesToData({ cell }) };
}

describe('dataMapper', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  });

  afterEach(() => {
    graph.clear();
  });

  describe('element round-trip', () => {
    it('should convert element data to JointJS and back', () => {
      const id = 'el-1';
      const data: GraphElement = { x: 10, y: 20, width: 100, height: 50 };

      const cellJson = defaultMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      expect(cellJson.position).toEqual({ x: 10, y: 20 });
      expect(cellJson.size).toEqual({ width: 100, height: 50 });
      expect(cellJson.type).toBe('ReactElement');

      graph.syncCells([cellJson], { remove: true });
      const cell = graph.getCell(id) as dia.Element;
      const result = defaultMapElementAttributesToData(graphToElementOpts(id, cell, graph));

      expect(result).toMatchObject({ x: 10, y: 20, width: 100, height: 50 });
    });

    it('should store user data in cell.data and extract on reverse', () => {
      type MyElement = GraphElement & { label: string; color: string };
      const id = 'el-1';
      const data: MyElement = { x: 0, y: 0, width: 50, height: 50, label: 'Hello', color: 'red' };

      const cellJson = defaultMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      expect(cellJson.data).toEqual({ label: 'Hello', color: 'red' });

      graph.syncCells([cellJson], { remove: true });
      const cell = graph.getCell(id) as dia.Element;
      const result = defaultMapElementAttributesToData(graphToElementOpts(id, cell, graph));

      expect((result as MyElement).label).toBe('Hello');
      expect((result as MyElement).color).toBe('red');
    });

    it('should preserve shape via previousData', () => {
      const id = 'el-1';
      const cellJson = {
        type: 'ReactElement',
        id,
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        data: { known: 'value', extra: 'should-be-filtered' },
      } as dia.Cell.JSON;
      graph.syncCells([cellJson], { remove: true });
      const cell = graph.getCell(id) as dia.Element;

      type E = GraphElement & { known?: string; extra?: string };
      const previousData: E = { x: 0, y: 0, width: 0, height: 0, known: undefined };

      const result = defaultMapElementAttributesToData(graphToElementOpts(id, cell, graph, previousData));
      expect(result).toHaveProperty('known', 'value');
      expect(result).not.toHaveProperty('extra');
    });
  });

  describe('element ports conversion', () => {
    it('should convert simplified ports to JointJS format', () => {
      const ports: GraphElementPort[] = [
        { cx: 0, cy: 0.5, width: 10, height: 10, color: 'blue', id: 'p1' },
      ];
      const id = 'el-1';
      const data: GraphElement = { x: 0, y: 0, width: 100, height: 100, ports };

      const cellJson = defaultMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      expect(cellJson.ports).toBeDefined();
      expect(cellJson.ports.groups.main).toBeDefined();
      expect(cellJson.ports.items).toHaveLength(1);
      expect(cellJson.ports.items[0].id).toBe('p1');
    });

    it('should convert port with label', () => {
      const ports: GraphElementPort[] = [
        { cx: 0, cy: 0.5, label: 'Port A', labelPosition: 'outside', labelColor: 'red', id: 'p1' },
      ];
      const id = 'el-1';
      const data: GraphElement = { x: 0, y: 0, width: 100, height: 100, ports };

      const cellJson = defaultMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      const [port] = cellJson.ports.items;
      expect(port.label).toBeDefined();
      expect(port.label.position.name).toBe('outside');
      expect(port.attrs?.text?.text).toBe('Port A');
    });

    it('should handle rect shape ports', () => {
      const ports: GraphElementPort[] = [
        { cx: 0, cy: 0, width: 20, height: 10, shape: 'rect', id: 'p1' },
      ];
      const id = 'el-1';
      const data: GraphElement = { x: 0, y: 0, width: 100, height: 100, ports };

      const cellJson = defaultMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      const portMarkup = cellJson.ports.items[0].markup;
      expect(portMarkup[0].tagName).toBe('rect');
    });
  });

  describe('link round-trip', () => {
    it('should convert link data to JointJS and back', () => {
      const id = 'link-1';
      const data: GraphLink = { source: 'el-1', target: 'el-2' };

      const cellJson = defaultMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.source).toEqual({ id: 'el-1' });
      expect(cellJson.target).toEqual({ id: 'el-2' });
      expect(cellJson.type).toBe(REACT_LINK_TYPE);
      expect(cellJson.attrs?.line).toBeDefined();

      graph.syncCells([cellJson], { remove: true });
      const cell = graph.getCell(id) as dia.Link;
      const result = defaultMapLinkAttributesToData(graphToLinkOpts(id, cell, graph));

      expect(result.source).toEqual({ id: 'el-1' });
      expect(result.target).toEqual({ id: 'el-2' });
    });

    it('should apply theme defaults', () => {
      const id = 'link-1';
      const data: GraphLink = { source: 'a', target: 'b' };

      const cellJson = defaultMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.attrs?.line?.stroke).toBe('#333333');
      expect(cellJson.attrs?.line?.strokeWidth).toBe(2);
      // Default theme values stored in data
      expect(cellJson.data?.color).toBe('#333333');
      expect(cellJson.data?.width).toBe(2);
    });

    it('should apply custom theme props', () => {
      const id = 'link-1';
      const data: GraphLink = { source: 'a', target: 'b', color: 'red', width: 4, pattern: '5 5' };

      const cellJson = defaultMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.attrs?.line?.stroke).toBe('red');
      expect(cellJson.attrs?.line?.strokeWidth).toBe(4);
      expect(cellJson.attrs?.line?.strokeDasharray).toBe('5 5');
    });

    it('should store user data in cell.data alongside theme props', () => {
      type MyLink = GraphLink & { weight: number };
      const id = 'link-1';
      const data: MyLink = { source: 'a', target: 'b', weight: 5 };

      const cellJson = defaultMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.data?.weight).toBe(5);
      expect(cellJson.data?.color).toBe('#333333');
    });

    it('should preserve link shape via previousData', () => {
      const id = 'link-1';
      const cellJson = {
        type: 'standard.Link',
        id,
        source: { id: 'a' },
        target: { id: 'b' },
        data: { known: 'value', extra: 'filtered' },
      } as dia.Cell.JSON;
      graph.syncCells([cellJson], { remove: true });
      const cell = graph.getCell(id) as dia.Link;

      type L = GraphLink & { known?: string; extra?: string };
      const previousData: L = { source: 'a', target: 'b', known: undefined };

      const result = defaultMapLinkAttributesToData(graphToLinkOpts(id, cell, graph, previousData));
      expect(result).toHaveProperty('known', 'value');
      expect(result).not.toHaveProperty('extra');
    });

    it('should handle object source/target with ports', () => {
      const id = 'link-1';
      const data: GraphLink = {
        source: { id: 'el-1', port: 'p1' },
        target: { id: 'el-2', port: 'p2' },
      };

      const cellJson = defaultMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.source).toEqual({ id: 'el-1', port: 'p1' });
      expect(cellJson.target).toEqual({ id: 'el-2', port: 'p2' });
    });
  });

  describe('named exports', () => {
    it('should export all four mapper functions', () => {
      expect(defaultMapDataToElementAttributes).toBeInstanceOf(Function);
      expect(defaultMapDataToLinkAttributes).toBeInstanceOf(Function);
      expect(defaultMapElementAttributesToData).toBeInstanceOf(Function);
      expect(defaultMapLinkAttributesToData).toBeInstanceOf(Function);
    });
  });
});
