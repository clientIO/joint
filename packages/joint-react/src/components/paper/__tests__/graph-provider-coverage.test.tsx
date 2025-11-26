/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/no-identical-functions */
import React, { useState } from 'react';
import { render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { useElements, useLinks } from '../../../hooks';
import { createElements } from '../../../utils/create';
import type { GraphElement } from '../../../types/element-types';
import type { GraphLink } from '../../../types/link-types';
import { GraphProvider } from '../../graph/graph-provider';
import { createStoreWithGraph } from '../../../data/create-graph-store';

describe('GraphProvider Coverage Tests', () => {
  describe('Edge cases for controlled mode', () => {
    it('should handle undefined elements in controlled mode', async () => {
      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.length);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<GraphElement[]>([]);
        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(0);
      });
    });

    it('should handle undefined links in controlled mode', async () => {
      let linkCount = 0;

      function TestComponent() {
        linkCount = useLinks((items) => items.length);
        return null;
      }

      function ControlledGraph() {
        const [links, setLinks] = useState<dia.Link[]>([]);
        return (
          <GraphProvider links={links} onLinksChange={setLinks}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(linkCount).toBe(0);
      });
    });

    it('should handle only elements controlled (not links)', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);

      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.length);
        linkCount = useLinks((items) => items.length);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);
        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(1);
        expect(linkCount).toBe(0);
      });
    });

    it('should handle only links controlled (not elements)', async () => {
      const initialLink = new dia.Link({
        id: 'link1',
        type: 'standard.Link',
        source: { id: '1' },
        target: { id: '2' },
      });

      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.length);
        linkCount = useLinks((items) => items.length);
        return null;
      }

      function ControlledGraph() {
        const [links, setLinks] = useState([initialLink]);
        return (
          <GraphProvider links={links} onLinksChange={setLinks}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(0);
        expect(linkCount).toBe(1);
      });
    });
  });

  describe('create-graph-store error cases', () => {
    it('should throw error when graph is null in createStoreWithGraph', () => {
      expect(() => {
        createStoreWithGraph({
          graph: undefined as unknown as dia.Graph,
        });
      }).toThrow('Graph instance is required');
    });

    it('should throw error when getLink is called with non-existent id', () => {
      const graph = new dia.Graph();
      const store = createStoreWithGraph({ graph });

      expect(() => {
        store.getLink('non-existent-id');
      }).toThrow('Link with id non-existent-id not found');
    });

    it('should handle skipGraphUpdate path in forceUpdateStore', async () => {
      const graph = new dia.Graph();
      const store = createStoreWithGraph({
        graph,
        onElementsChange: () => {},
      });

      // Force update with skipGraphUpdate flag
      const result = store.forceUpdateStore(undefined, true);

      expect(result).toBeDefined();
      expect(result.areElementsChanged).toBe(false);
      expect(result.areLinksChanged).toBe(false);
    });
  });

  describe('create-store-data structural changes', () => {
    it('should detect reordering of elements in updateFromExternalData', () => {
      const graph = new dia.Graph();
      const store = createStoreWithGraph({ graph });

      const elements1 = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
        { id: '2', width: 100, height: 100, type: 'ReactElement' },
      ]);

      const elements2 = createElements([
        { id: '2', width: 100, height: 100, type: 'ReactElement' },
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);

      // Initial update
      store.updateStoreFromExternalData(elements1, []);

      // Reorder (same elements, different order)
      const result = store.updateStoreFromExternalData(elements2, []);

      // Reordering should be detected as a structural change
      expect(result.areElementsChanged).toBe(true);
    });

    it('should detect reordering of links in updateFromExternalData', () => {
      const graph = new dia.Graph();
      const store = createStoreWithGraph({ graph });

      // Create links as JSON to match GraphLink type
      const link1: GraphLink = {
        id: 'link1',
        type: 'standard.Link',
        source: '1',
        target: '2',
      };
      const link2: GraphLink = {
        id: 'link2',
        type: 'standard.Link',
        source: '2',
        target: '3',
      };

      // Initial update
      store.updateStoreFromExternalData([], [link1, link2]);

      // Reorder (same links, different order) - create new objects to ensure they're different references
      const link1Reordered: GraphLink = {
        id: 'link1',
        type: 'standard.Link',
        source: '1',
        target: '2',
      };
      const link2Reordered: GraphLink = {
        id: 'link2',
        type: 'standard.Link',
        source: '2',
        target: '3',
      };
      const result = store.updateStoreFromExternalData([], [link2Reordered, link1Reordered]);

      // Reordering should be detected as a structural change
      expect(result.areLinksChanged).toBe(true);
    });

    it('should detect changes in updateStore when graph cells are modified', () => {
      const graph = new dia.Graph();
      const element1 = new dia.Element({
        id: '1',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new dia.Element({
        id: '2',
        type: 'ReactElement',
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });

      graph.addCell([element1, element2]);

      const store = createStoreWithGraph({ graph });

      // Initial update
      store.forceUpdateStore();

      // Change element position to trigger update
      element1.set('position', { x: 10, y: 10 });
      const result = store.forceUpdateStore();

      // Should detect change
      expect(result.areElementsChanged).toBe(true);
      expect(result.diffIds.has('1')).toBe(true);
    });
  });

  describe('GraphProvider edge cases', () => {
    it('should handle unmeasured elements (width/height <= 1)', async () => {
      const unmeasuredElements = createElements([
        { id: '1', width: 0, height: 0, type: 'ReactElement' },
        { id: '2', width: 1, height: 1, type: 'ReactElement' },
      ]);

      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.length);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState(unmeasuredElements);
        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      // Should still work with unmeasured elements
      await waitFor(() => {
        expect(elementCount).toBe(2);
      });
    });

    it('should handle cleanup in GraphBase when store exists', () => {
      const graph = new dia.Graph();
      const store = createStoreWithGraph({ graph });

      const { unmount } = render(
        <GraphProvider store={store}>
          <div>Test</div>
        </GraphProvider>
      );

      // Store should work before unmount
      expect(() => {
        store.getElements();
      }).not.toThrow();

      unmount();

      // Store should still work after unmount (it's not destroyed)
      expect(() => {
        store.getElements();
      }).not.toThrow();
    });
  });
});
