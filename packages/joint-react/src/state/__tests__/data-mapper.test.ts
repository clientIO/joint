/* eslint-disable unicorn/prevent-abbreviations */

import { dia, shapes } from '@joint/core';
import { PortalElement } from '../../models/portal-element';
import { PortalLink, PORTAL_LINK_TYPE } from '../../models/portal-link';
import type { MixedElementRecord, PortalElementPort, MixedLinkRecord } from '../../types/data-types';
import {
  elementToAttributes,
  linkToAttributes,
  attributesToElement,
  attributesToLink,
} from '../data-mapping';
import { defaultLinkStyle } from '../../theme/link-theme';

const DEFAULT_CELL_NAMESPACE = { ...shapes, PortalElement, PortalLink };

describe('dataMapper', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  });

  afterEach(() => {
    graph.clear();
  });

  describe('element round-trip', () => {
    it('should convert ElementInput to JointJS and back', () => {
      const id = 'el-1';
      const element: MixedElementRecord<undefined> = { data: undefined, position: { x: 10, y: 20 }, size: { width: 100, height: 50 } };

      const cellJson = elementToAttributes({ id, element });
      expect(cellJson.position).toEqual({ x: 10, y: 20 });
      expect(cellJson.size).toEqual({ width: 100, height: 50 });
      expect(cellJson.type).toBe('PortalElement');

      graph.addCell(cellJson as dia.Cell.JSON);
      const cell = graph.getCell(id) as dia.Element;
      const result = attributesToElement(cell.attributes);

      // Layout fields included via position/size
      expect(result).toMatchObject({ position: { x: 10, y: 20 }, size: { width: 100, height: 50 } });
      // User data nested in data field
      expect(result).toHaveProperty('data');
    });

    it('should store user data in data field and extract on reverse', () => {
      const id = 'el-1';
      const element: MixedElementRecord = {
        data: { label: 'Hello', color: 'red' },
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
      };

      const cellJson = elementToAttributes({ id, element });
      expect(cellJson.data).toMatchObject({ label: 'Hello', color: 'red' });

      graph.addCell(cellJson as dia.Cell.JSON);
      const cell = graph.getCell(id) as dia.Element;
      const result = attributesToElement(cell.attributes);

      expect(result).toHaveProperty('data.label', 'Hello');
      expect(result).toHaveProperty('data.color', 'red');
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

      const result = attributesToElement(cell.attributes);
      expect(result).toHaveProperty('data.known', 'value');
      expect(result).toHaveProperty('data.extra', 'also-included');
    });

    it('should round-trip with ports', () => {
      const id = 'el-1';
      const element: MixedElementRecord = {
        data: { label: 'Node 1' },
        position: { x: 100, y: 50 },
        size: { width: 150, height: 60 },
        ports: { p1: { cx: 0, cy: '50%' } },
      };

      const cellJson = elementToAttributes({ id, element });
      expect(cellJson.position).toEqual({ x: 100, y: 50 });
      expect(cellJson.data).toMatchObject({ label: 'Node 1' });
      expect(cellJson.presentation).toMatchObject({ ports: { p1: { cx: 0, cy: '50%' } } });

      graph.addCell(cellJson as dia.Cell.JSON);
      const cell = graph.getCell(id) as dia.Element;
      const result = attributesToElement(cell.attributes);

      expect(result).toHaveProperty('data.label', 'Node 1');
      // Ports are available at top level
      expect(result).toHaveProperty('ports');
    });
  });

  describe('element ports conversion', () => {
    it('should convert simplified ports to JointJS format', () => {
      const ports: Record<string, PortalElementPort> = {
        p1: { cx: 0, cy: 0.5, width: 10, height: 10, color: 'blue' },
      };
      const id = 'el-1';
      const element: MixedElementRecord = { position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, ports };

      const cellJson = elementToAttributes({ id, element });
      expect(cellJson.ports).toBeDefined();
      expect(cellJson.ports.groups.main).toBeDefined();
      expect(cellJson.ports.items).toHaveLength(1);
      expect(cellJson.ports.items[0].id).toBe('p1');
    });

    it('should convert port with label', () => {
      const ports: Record<string, PortalElementPort> = {
        p1: { cx: 0, cy: 0.5, label: 'Port A', labelPosition: 'outside', labelColor: 'red' },
      };
      const id = 'el-1';
      const element: MixedElementRecord = { position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, ports };

      const cellJson = elementToAttributes({ id, element });
      const [port] = cellJson.ports.items;
      expect(port.label).toBeDefined();
      expect(port.label.position.name).toBe('outside');
      expect(port.attrs?.text?.text).toBe('Port A');
    });

    it('should handle rect shape ports', () => {
      const ports: Record<string, PortalElementPort> = {
        p1: { cx: 0, cy: 0, width: 20, height: 10, shape: 'rect' },
      };
      const id = 'el-1';
      const element: MixedElementRecord = { position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, ports };

      const cellJson = elementToAttributes({ id, element });
      const portMarkup = cellJson.ports.items[0].markup;
      expect(portMarkup[0].tagName).toBe('rect');
    });
  });

  describe('link round-trip', () => {
    it('should convert link data to JointJS and back', () => {
      const id = 'link-1';
      const link: MixedLinkRecord = { source: { id: 'el-1' }, target: { id: 'el-2' } };

      const cellJson = linkToAttributes({ id, link });
      expect(cellJson.source).toEqual({ id: 'el-1' });
      expect(cellJson.target).toEqual({ id: 'el-2' });
      expect(cellJson.type).toBe(PORTAL_LINK_TYPE);
      expect(cellJson.attrs?.line).toBeDefined();

      graph.addCell(cellJson as dia.Cell.JSON);
      const cell = graph.getCell(id) as dia.Link;
      const result = attributesToLink(cell.attributes);

      expect(result.source).toEqual({ id: 'el-1' });
      expect(result.target).toEqual({ id: 'el-2' });
    });

    it('should apply theme defaults', () => {
      const id = 'link-1';
      const link: MixedLinkRecord = { source: { id: 'a' }, target: { id: 'b' } };

      const cellJson = linkToAttributes({ id, link });
      expect(cellJson.attrs?.line?.style?.stroke).toBe(defaultLinkStyle.color);
      expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(defaultLinkStyle.width);
      // Theme-defaulted values should NOT be stored in presentation
      expect(cellJson.presentation?.color).toBeUndefined();
      expect(cellJson.presentation?.width).toBeUndefined();
    });

    it('should apply custom theme props', () => {
      const id = 'link-1';
      const link: MixedLinkRecord = {
        source: { id: 'a' },
        target: { id: 'b' },
        color: 'red',
        width: 4,
        dasharray: '5 5',
      };

      const cellJson = linkToAttributes({ id, link });
      expect(cellJson.attrs?.line?.style?.stroke).toBe('red');
      expect(cellJson.attrs?.line?.style?.strokeWidth).toBe(4);
      expect(cellJson.attrs?.line?.style?.strokeDasharray).toBe('5 5');
    });

    it('should store user data in cell.data', () => {
      const id = 'link-1';
      const link: MixedLinkRecord = { source: { id: 'a' }, target: { id: 'b' }, data: { weight: 5 } };

      const cellJson = linkToAttributes({ id, link });
      expect(cellJson.data?.weight).toBe(5);
      // Presentation values are not in data
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

      // previousData is passed through but the default mapper does not filter by it
      const result = attributesToLink(cell.attributes);
      expect(result).toHaveProperty('data.known', 'value');
      expect(result).toHaveProperty('data.extra', 'also-included');
    });

    it('should convert labels Record to JointJS labels array', () => {
      const id = 'link-1';
      const link: MixedLinkRecord = {
        source: { id: 'a' },
        target: { id: 'b' },
        labels: {
          lbl1: { text: 'Yes', position: 0.3 },
          lbl2: { text: 'No', position: 0.7, offset: 20 },
        },
      };

      const cellJson = linkToAttributes({ id, link });
      expect(cellJson.labels).toHaveLength(2);
      expect(cellJson.labels[0]).toMatchObject({ id: 'lbl1', position: { distance: 0.3 } });
      expect(cellJson.labels[1]).toMatchObject({
        id: 'lbl2',
        position: { distance: 0.7, offset: 20 },
      });
    });

    it('should round-trip labels with position and offset changes', () => {
      const id = 'link-1';
      const link: MixedLinkRecord = {
        source: { id: 'a' },
        target: { id: 'b' },
        labels: {
          lbl1: { text: 'Yes', position: 0.3 },
        },
      };

      const cellJson = linkToAttributes({ id, link });
      graph.addCell(cellJson as dia.Cell.JSON);
      const cell = graph.getCell(id) as dia.Link;

      // Simulate labelMove updating position and offset
      const labels = cell.labels();
      labels[0].position = { distance: 0.6, offset: 15 };
      cell.labels(labels);

      const result = attributesToLink(cell.attributes);
      expect(result.labels).toBeDefined();
      expect(result.labels!['lbl1']).toMatchObject({ text: 'Yes', position: 0.6, offset: 15 });
    });

    it('should handle source/target with ports', () => {
      const id = 'link-1';
      const link: MixedLinkRecord = {
        source: { id: 'el-1', port: 'p1' },
        target: { id: 'el-2', port: 'p2' },
      };

      const cellJson = linkToAttributes({ id, link });
      expect(cellJson.source).toEqual({ id: 'el-1', port: 'p1' });
      expect(cellJson.target).toEqual({ id: 'el-2', port: 'p2' });
    });
  });

  describe('named exports', () => {
    it('should export all four mapper functions', () => {
      expect(elementToAttributes).toBeInstanceOf(Function);
      expect(linkToAttributes).toBeInstanceOf(Function);
      expect(attributesToElement).toBeInstanceOf(Function);
      expect(attributesToLink).toBeInstanceOf(Function);
    });
  });

  describe('element attrs handling', () => {
    it('should not include attrs when undefined (PortalElement default)', () => {
      const cellJson = elementToAttributes({
        id: 'el-1',
        element: { data: undefined, position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
      });
      expect(cellJson).not.toHaveProperty('attrs');
    });

    it('should pass attrs through when provided', () => {
      const cellJson = elementToAttributes({
        id: 'el-1',
        element: {
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
          attrs: { body: { fill: 'red' }, label: { text: 'Hello', fill: 'white' } },
        },
      });
      expect(cellJson.attrs).toEqual({ body: { fill: 'red' }, label: { text: 'Hello', fill: 'white' } });
    });

    it('should pass custom type through', () => {
      const cellJson = elementToAttributes({
        id: 'el-1',
        element: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, type: 'standard.Rectangle' },
      });
      expect(cellJson.type).toBe('standard.Rectangle');
    });

    it('should round-trip attrs and type', () => {
      const cellJson = elementToAttributes({
        id: 'el-1',
        element: {
          position: { x: 10, y: 20 },
          size: { width: 80, height: 40 },
          type: 'standard.Rectangle',
          attrs: { body: { fill: 'blue' }, label: { text: 'Test', fill: 'white' } },
        },
      });

      graph.addCell(cellJson as dia.Cell.JSON);
      const cell = graph.getCell('el-1') as dia.Element;
      const result = attributesToElement(cell.attributes);

      expect(result.type).toBe('standard.Rectangle');
      expect(result.attrs).toBeDefined();
    });
  });

  describe('built-in shapes (native JointJS)', () => {
    it('standard.Rectangle should render with correct body size after addCell', () => {
      const cellJson = elementToAttributes({
        id: 'rect-1',
        element: {
          position: { x: 20, y: 20 },
          size: { width: 100, height: 50 },
          type: 'standard.Rectangle',
          attrs: { body: { fill: 'red' }, label: { fill: 'white', text: 'Rectangle' } },
        },
      });

      graph.addCell(cellJson as dia.Cell.JSON);
      const cell = graph.getCell('rect-1') as dia.Element;

      // Cell should have the correct size
      expect(cell.size()).toEqual({ width: 100, height: 50 });
      expect(cell.position()).toEqual({ x: 20, y: 20 });

      // The body attrs from standard.Rectangle defaults should be preserved
      // (refWidth, refHeight etc.) — user attrs should merge, not replace
      const bodyAttrs = cell.attr('body');
      expect(bodyAttrs.fill).toBe('red');
      // refWidth/refHeight come from standard.Rectangle defaults
      expect(bodyAttrs.width).toBe('calc(w)');
      expect(bodyAttrs.height).toBe('calc(h)');
    });

    it('standard.Rectangle should work via syncCells (not just addCell)', () => {
      const cellJson = elementToAttributes({
        id: 'sync-rect',
        element: {
          position: { x: 0, y: 0 },
          size: { width: 120, height: 60 },
          type: 'standard.Rectangle',
          attrs: { body: { fill: 'green' }, label: { fill: 'white', text: 'Synced' } },
        },
      });

      // syncCells is what GraphProvider actually uses
      graph.syncCells([cellJson as dia.Cell.JSON], { remove: true });
      const cell = graph.getCell('sync-rect') as dia.Element;

      expect(cell).toBeDefined();
      expect(cell.size()).toEqual({ width: 120, height: 60 });

      const bodyAttrs = cell.attr('body');
      expect(bodyAttrs.fill).toBe('green');
      // Model defaults should be preserved
      expect(bodyAttrs.width).toBe('calc(w)');
      expect(bodyAttrs.height).toBe('calc(h)');
    });

    it('standard.Circle should preserve default body attrs', () => {
      const cellJson = elementToAttributes({
        id: 'circle-1',
        element: {
          position: { x: 0, y: 0 },
          size: { width: 60, height: 60 },
          type: 'standard.Circle',
          attrs: { body: { fill: 'blue', stroke: '#333' }, label: { fill: 'white', text: 'Circle' } },
        },
      });

      graph.addCell(cellJson as dia.Cell.JSON);
      const cell = graph.getCell('circle-1') as dia.Element;

      const bodyAttrs = cell.attr('body');
      expect(bodyAttrs.fill).toBe('blue');
      expect(bodyAttrs.stroke).toBe('#333');
      // Default circle attrs should still be present (standard.Circle uses calc(s/2))
      expect(bodyAttrs.cx).toBe('calc(s/2)');
      expect(bodyAttrs.cy).toBe('calc(s/2)');
    });
  });
});
