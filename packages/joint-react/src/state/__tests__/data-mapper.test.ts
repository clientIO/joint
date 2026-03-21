/* eslint-disable unicorn/prevent-abbreviations */
 
 
import { dia, shapes } from '@joint/core';
import { PortalElement } from '../../models/portal-element';
import { PortalLink, PORTAL_LINK_TYPE } from '../../models/portal-link';
import type { FlatElementData, FlatElementPort } from '../../types/element-types';
import type { FlatLinkData } from '../../types/link-types';
import type { ToElementAttributesOptions, ToElementDataOptions } from '../data-mapping/element-mapper';
import type { ToLinkAttributesOptions, ToLinkDataOptions } from '../data-mapping/link-mapper';
import {
  flatMapDataToElementAttributes,
  flatMapDataToLinkAttributes,
  flatMapElementAttributesToData,
  flatMapLinkAttributesToData,
} from '../data-mapping';
import { resolveCellDefaults } from '../data-mapping/resolve-cell-defaults';
import { defaultLinkStyle } from '../../theme/link-theme';

const DEFAULT_CELL_NAMESPACE = { ...shapes, PortalElement, PortalLink };

function elementToGraphOpts(
  id: string,
  data: FlatElementData,
  graph: dia.Graph
): ToElementAttributesOptions<FlatElementData> {
  return {
    id,
    data,
    graph,
    toAttributes: (d) => flatMapDataToElementAttributes({ id, data: d }),
  };
}
function graphToElementOpts(
  id: string,
  cell: dia.Element,
  graph: dia.Graph,
  previousData?: FlatElementData
): ToElementDataOptions<FlatElementData> {
  const defaultAttributes = resolveCellDefaults(cell);
  return {
    id,
    attributes: cell.attributes,
    defaultAttributes,
    element: cell,
    graph,
    previousData,
    toData: (attributes) => flatMapElementAttributesToData({ attributes, defaultAttributes }),
  };
}
function linkToGraphOpts(
  id: string,
  data: FlatLinkData,
  graph: dia.Graph
): ToLinkAttributesOptions<FlatLinkData> {
  return { id, data, graph, toAttributes: (d) => flatMapDataToLinkAttributes({ id, data: d }) };
}
function graphToLinkOpts(
  id: string,
  cell: dia.Link,
  graph: dia.Graph,
  previousData?: FlatLinkData
): ToLinkDataOptions<FlatLinkData> {
  const defaultAttributes = resolveCellDefaults(cell);
  return {
    id,
    attributes: cell.attributes,
    defaultAttributes,
    link: cell,
    graph,
    previousData,
    toData: (attributes) => flatMapLinkAttributesToData({ attributes, defaultAttributes }),
  };
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
      const data: FlatElementData = { x: 10, y: 20, width: 100, height: 50 };

      const cellJson = flatMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      expect(cellJson.position).toEqual({ x: 10, y: 20 });
      expect(cellJson.size).toEqual({ width: 100, height: 50 });
      expect(cellJson.type).toBe('PortalElement');

      graph.addCell(cellJson);
      const cell = graph.getCell(id) as dia.Element;
      const result = flatMapElementAttributesToData(graphToElementOpts(id, cell, graph));

      expect(result).toMatchObject({ x: 10, y: 20, width: 100, height: 50 });
    });

    it('should store user data in cell.data and extract on reverse', () => {
      type MyElement = FlatElementData & { label: string; color: string };
      const id = 'el-1';
      const data: MyElement = { x: 0, y: 0, width: 50, height: 50, label: 'Hello', color: 'red' };

      const cellJson = flatMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      expect(cellJson.data).toEqual({ label: 'Hello', color: 'red' });

      graph.addCell(cellJson);
      const cell = graph.getCell(id) as dia.Element;
      const result = flatMapElementAttributesToData(graphToElementOpts(id, cell, graph));

      expect((result as MyElement).label).toBe('Hello');
      expect((result as MyElement).color).toBe('red');
    });

    it('should include all cell.data properties regardless of previousData', () => {
      const id = 'el-1';
      const cellJson = {
        type: 'PortalElement',
        id,
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        data: { known: 'value', extra: 'also-included' },
      } as dia.Cell.JSON;
      graph.addCell(cellJson);
      const cell = graph.getCell(id) as dia.Element;

      type E = FlatElementData & { known?: string; extra?: string };
      const previousData: E = { x: 0, y: 0, width: 0, height: 0, known: undefined };

      const result = flatMapElementAttributesToData(
        graphToElementOpts(id, cell, graph, previousData)
      );
      // previousData is passed through but the default mapper does not filter by it
      expect(result).toHaveProperty('known', 'value');
      expect(result).toHaveProperty('extra', 'also-included');
    });
  });

  describe('element ports conversion', () => {
    it('should convert simplified ports to JointJS format', () => {
      const ports: Record<string, FlatElementPort> = {
        p1: { cx: 0, cy: 0.5, width: 10, height: 10, color: 'blue' },
      };
      const id = 'el-1';
      const data: FlatElementData = { x: 0, y: 0, width: 100, height: 100, ports };

      const cellJson = flatMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      expect(cellJson.ports).toBeDefined();
      expect(cellJson.ports.groups.main).toBeDefined();
      expect(cellJson.ports.items).toHaveLength(1);
      expect(cellJson.ports.items[0].id).toBe('p1');
    });

    it('should convert port with label', () => {
      const ports: Record<string, FlatElementPort> = {
        p1: { cx: 0, cy: 0.5, label: 'Port A', labelPosition: 'outside', labelColor: 'red' },
      };
      const id = 'el-1';
      const data: FlatElementData = { x: 0, y: 0, width: 100, height: 100, ports };

      const cellJson = flatMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      const [port] = cellJson.ports.items;
      expect(port.label).toBeDefined();
      expect(port.label.position.name).toBe('outside');
      expect(port.attrs?.text?.text).toBe('Port A');
    });

    it('should handle rect shape ports', () => {
      const ports: Record<string, FlatElementPort> = {
        p1: { cx: 0, cy: 0, width: 20, height: 10, shape: 'rect' },
      };
      const id = 'el-1';
      const data: FlatElementData = { x: 0, y: 0, width: 100, height: 100, ports };

      const cellJson = flatMapDataToElementAttributes(elementToGraphOpts(id, data, graph));
      const portMarkup = cellJson.ports.items[0].markup;
      expect(portMarkup[0].tagName).toBe('rect');
    });
  });

  describe('link round-trip', () => {
    it('should convert link data to JointJS and back', () => {
      const id = 'link-1';
      const data: FlatLinkData = { source: 'el-1', target: 'el-2' };

      const cellJson = flatMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.source).toEqual({ id: 'el-1' });
      expect(cellJson.target).toEqual({ id: 'el-2' });
      expect(cellJson.type).toBe(PORTAL_LINK_TYPE);
      expect(cellJson.attrs?.line).toBeDefined();

      graph.addCell(cellJson);
      const cell = graph.getCell(id) as dia.Link;
      const result = flatMapLinkAttributesToData(graphToLinkOpts(id, cell, graph));

      expect(result.source).toBe('el-1');
      expect(result.target).toBe('el-2');
    });

    it('should apply theme defaults', () => {
      const id = 'link-1';
      const data: FlatLinkData = { source: 'a', target: 'b' };

      const cellJson = flatMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.attrs?.line?.style?.stroke).toBe(defaultLinkStyle.color);
      expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(defaultLinkStyle.width);
      // Theme-defaulted values should NOT be stored in data
      expect(cellJson.data?.color).toBeUndefined();
      expect(cellJson.data?.width).toBeUndefined();
    });

    it('should apply custom theme props', () => {
      const id = 'link-1';
      const data: FlatLinkData = {
        source: 'a',
        target: 'b',
        color: 'red',
        width: 4,
        pattern: '5 5',
      };

      const cellJson = flatMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.attrs?.line?.style?.stroke).toBe('red');
      expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(4);
      expect(cellJson.attrs?.line?.style?.strokeDasharray).toBe('5 5');
    });

    it('should store user data in cell.data alongside theme props', () => {
      type MyLink = FlatLinkData & { weight: number };
      const id = 'link-1';
      const data: MyLink = { source: 'a', target: 'b', weight: 5 };

      const cellJson = flatMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.data?.weight).toBe(5);
      // Theme-defaulted values should NOT be stored in data
      expect(cellJson.data?.color).toBeUndefined();
    });

    it('should include all cell.data properties regardless of previousData', () => {
      const id = 'link-1';
      const cellJson = {
        type: 'standard.Link',
        id,
        source: { id: 'a' },
        target: { id: 'b' },
        data: { known: 'value', extra: 'also-included' },
      } as dia.Cell.JSON;
      graph.addCell(cellJson);
      const cell = graph.getCell(id) as dia.Link;

      type L = FlatLinkData & { known?: string; extra?: string };
      const previousData: L = { source: 'a', target: 'b', known: undefined };

      // previousData is passed through but the default mapper does not filter by it
      const result = flatMapLinkAttributesToData(graphToLinkOpts(id, cell, graph, previousData));
      expect(result).toHaveProperty('known', 'value');
      expect(result).toHaveProperty('extra', 'also-included');
    });

    it('should convert labels Record to JointJS labels array', () => {
      const id = 'link-1';
      const data: FlatLinkData = {
        source: 'a',
        target: 'b',
        labels: {
          lbl1: { text: 'Yes', position: 0.3 },
          lbl2: { text: 'No', position: 0.7, offset: 20 },
        },
      };

      const cellJson = flatMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.labels).toHaveLength(2);
      expect(cellJson.labels[0]).toMatchObject({ id: 'lbl1', position: { distance: 0.3 } });
      expect(cellJson.labels[1]).toMatchObject({
        id: 'lbl2',
        position: { distance: 0.7, offset: 20 },
      });
    });

    it('should round-trip labels with position and offset changes', () => {
      const id = 'link-1';
      const data: FlatLinkData = {
        source: 'a',
        target: 'b',
        labels: {
          lbl1: { text: 'Yes', position: 0.3 },
        },
      };

      const cellJson = flatMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      graph.addCell(cellJson);
      const cell = graph.getCell(id) as dia.Link;

      // Simulate labelMove updating position and offset
      const labels = cell.labels();
      labels[0].position = { distance: 0.6, offset: 15 };
      cell.labels(labels);

      const result = flatMapLinkAttributesToData(graphToLinkOpts(id, cell, graph));
      expect(result.labels).toBeDefined();
      expect(result.labels!['lbl1']).toMatchObject({ text: 'Yes', position: 0.6, offset: 15 });
    });

    it('should handle source/target with ports', () => {
      const id = 'link-1';
      const data: FlatLinkData = {
        source: 'el-1',
        target: 'el-2',
        sourcePort: 'p1',
        targetPort: 'p2',
      };

      const cellJson = flatMapDataToLinkAttributes(linkToGraphOpts(id, data, graph));
      expect(cellJson.source).toEqual({ id: 'el-1', port: 'p1' });
      expect(cellJson.target).toEqual({ id: 'el-2', port: 'p2' });
    });
  });

  describe('named exports', () => {
    it('should export all four mapper functions', () => {
      expect(flatMapDataToElementAttributes).toBeInstanceOf(Function);
      expect(flatMapDataToLinkAttributes).toBeInstanceOf(Function);
      expect(flatMapElementAttributesToData).toBeInstanceOf(Function);
      expect(flatMapLinkAttributesToData).toBeInstanceOf(Function);
    });
  });
});
