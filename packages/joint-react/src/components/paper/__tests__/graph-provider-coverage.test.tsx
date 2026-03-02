/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/no-identical-functions */
import React, { useState } from 'react';
import { render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { useElements, useLinks } from '../../../hooks';
import type { GraphElement } from '../../../types/element-types';
import type { GraphLink } from '../../../types/link-types';
import { GraphProvider } from '../../graph/graph-provider';
import { GraphStore } from '../../../store';

describe('GraphProvider Coverage Tests', () => {
  describe('Edge cases for controlled mode', () => {
    it('should handle undefined elements in controlled mode', async () => {
      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => Object.keys(items).length);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>({});
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
        linkCount = useLinks((items) => Object.keys(items).length);
        return null;
      }

      function ControlledGraph() {
        const [links, setLinks] = useState<Record<string, GraphLink>>({});
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
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, type: 'ReactElement' },
      };

      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => Object.keys(items).length);
        linkCount = useLinks((items) => Object.keys(items).length);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(initialElements);
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
      const initialLink: GraphLink = {
        type: 'standard.Link',
        source: '1',
        target: '2',
      };

      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => Object.keys(items).length);
        linkCount = useLinks((items) => Object.keys(items).length);
        return null;
      }

      function ControlledGraph() {
        const [links, setLinks] = useState<Record<string, GraphLink>>(() => ({
          'link1': initialLink,
        }));
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

  describe('GraphStore error cases', () => {
    it('should create store with graph', () => {
      const graph = new dia.Graph();
      const store = new GraphStore({ graph });
      expect(store).toBeDefined();
      expect(store.graph).toBe(graph);
    });
  });

  describe('GraphProvider edge cases', () => {
    it('should handle unmeasured elements (width/height <= 1)', async () => {
      const unmeasuredElements: Record<string, GraphElement> = {
        '1': { width: 0, height: 0, type: 'ReactElement' },
        '2': { width: 1, height: 1, type: 'ReactElement' },
      };

      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => Object.keys(items).length);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(unmeasuredElements);
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
      const store = new GraphStore({ graph });

      const { unmount } = render(
        <GraphProvider store={store}>
          <div>Test</div>
        </GraphProvider>
      );

      // Store should work before unmount
      expect(() => {
        const { elements } = store.publicState.getSnapshot();
        expect(elements).toBeDefined();
      }).not.toThrow();

      unmount();

      // Store should still work after unmount (it's not destroyed)
      expect(() => {
        const { elements } = store.publicState.getSnapshot();
        expect(elements).toBeDefined();
      }).not.toThrow();
    });
  });
});
