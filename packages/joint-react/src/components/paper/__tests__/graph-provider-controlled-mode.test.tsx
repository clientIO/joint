/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/no-identical-functions */
import React, { useState, useCallback } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { useElements, useLinks, useGraph } from '../../../hooks';
import { createElements } from '../../../utils/create';
import type { GraphElement } from '../../../types/element-types';
import { GraphProvider } from '../../graph/graph-provider';

describe('GraphProvider Controlled Mode', () => {
  describe('Basic useState integration', () => {
    it('should sync React state to store and graph on initial mount', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
        { id: '2', width: 200, height: 200, type: 'ReactElement' },
      ]);

      let elementCount = 0;
      let elementIds: string[] = [];

      function TestComponent() {
        const elements = useElements((items) => items);
        elementCount = elements.length;
        elementIds = elements.map((element) => String(element.id));
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
        expect(elementCount).toBe(2);
        expect(elementIds).toEqual(['1', '2']);
      });
    });

    it('should update store when React state changes via useState', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);

      let elementCount = 0;
      let elementIds: string[] = [];

      function TestComponent() {
        const elements = useElements((items) => items);
        elementCount = elements.length;
        elementIds = elements.map((element) => String(element.id));
        return null;
      }

      let setElementsExternal: ((elements: GraphElement[]) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);
        setElementsExternal = setElements as (elements: GraphElement[]) => void;
        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(1);
        expect(elementIds).toEqual(['1']);
      });

      act(() => {
        setElementsExternal?.(
          createElements([
            { id: '1', width: 100, height: 100, type: 'ReactElement' },
            { id: '2', width: 200, height: 200, type: 'ReactElement' },
            { id: '3', width: 300, height: 300, type: 'ReactElement' },
          ])
        );
      });

      await waitFor(() => {
        expect(elementCount).toBe(3);
        expect(elementIds).toEqual(['1', '2', '3']);
      });
    });

    it('should handle both elements and links in controlled mode', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);
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

      let setElementsExternal: ((elements: GraphElement[]) => void) | null = null;
      let setLinksExternal: ((links: dia.Link[]) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);
        const [links, setLinks] = useState([initialLink]);
        setElementsExternal = setElements as (elements: GraphElement[]) => void;
        setLinksExternal = setLinks as (links: dia.Link[]) => void;
        return (
          <GraphProvider
            elements={elements}
            onElementsChange={setElements}
            links={links}
            onLinksChange={setLinks}
          >
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(1);
        expect(linkCount).toBe(1);
      });

      // Update elements only
      act(() => {
        setElementsExternal?.(
          createElements([
            { id: '1', width: 100, height: 100, type: 'ReactElement' },
            { id: '2', width: 200, height: 200, type: 'ReactElement' },
          ])
        );
      });

      await waitFor(() => {
        expect(elementCount).toBe(2);
        expect(linkCount).toBe(1); // Links should be preserved
      });

      // Update links only
      act(() => {
        setLinksExternal?.([
          new dia.Link({
            id: 'link1',
            type: 'standard.Link',
            source: { id: '1' },
            target: { id: '2' },
          }),
          new dia.Link({
            id: 'link2',
            type: 'standard.Link',
            source: { id: '2' },
            target: { id: '1' },
          }),
        ]);
      });

      await waitFor(() => {
        expect(elementCount).toBe(2); // Elements should be preserved
        expect(linkCount).toBe(2);
      });
    });
  });

  describe('Rapid consecutive updates', () => {
    it('should handle rapid consecutive state updates correctly', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);

      let elementCount = 0;

      function TestComponent() {
        const count = useElements((items) => items.length);
        elementCount = count;
        return null;
      }

      let setElementsExternal: ((elements: GraphElement[]) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);
        setElementsExternal = setElements as (elements: GraphElement[]) => void;
        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(1);
      });

      // Rapid consecutive updates
      act(() => {
        setElementsExternal?.(
          createElements([
            { id: '1', width: 100, height: 100, type: 'ReactElement' },
            { id: '2', width: 200, height: 200, type: 'ReactElement' },
          ])
        );
        setElementsExternal?.(
          createElements([
            { id: '1', width: 100, height: 100, type: 'ReactElement' },
            { id: '2', width: 200, height: 200, type: 'ReactElement' },
            { id: '3', width: 300, height: 300, type: 'ReactElement' },
          ])
        );
        setElementsExternal?.(
          createElements([
            { id: '1', width: 100, height: 100, type: 'ReactElement' },
            { id: '2', width: 200, height: 200, type: 'ReactElement' },
            { id: '3', width: 300, height: 300, type: 'ReactElement' },
            { id: '4', width: 400, height: 400, type: 'ReactElement' },
          ])
        );
      });

      await waitFor(
        () => {
          expect(elementCount).toBe(4);
        },
        { timeout: 3000 }
      );
    });

    it('should handle 10 rapid updates without losing state', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);

      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.length);
        return null;
      }

      let setElementsExternal: ((elements: GraphElement[]) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);
        setElementsExternal = setElements as (elements: GraphElement[]) => void;
        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(1);
      });

      // 10 rapid updates
      act(() => {
        for (let index = 2; index <= 11; index++) {
          setElementsExternal?.(
            createElements(
              Array.from({ length: index }, (_, elementIndex) => ({
                id: String(elementIndex + 1),
                width: 100 * (elementIndex + 1),
                height: 100 * (elementIndex + 1),
                type: 'ReactElement' as const,
              }))
            )
          );
        }
      });

      await waitFor(
        () => {
          expect(elementCount).toBe(11);
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Concurrent updates', () => {
    it('should handle concurrent element and link updates', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);
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

      let setElementsExternal: ((elements: GraphElement[]) => void) | null = null;
      let setLinksExternal: ((links: dia.Link[]) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);
        const [links, setLinks] = useState([initialLink]);
        setElementsExternal = setElements as (elements: GraphElement[]) => void;
        setLinksExternal = setLinks as (links: dia.Link[]) => void;
        return (
          <GraphProvider
            elements={elements}
            onElementsChange={setElements}
            links={links}
            onLinksChange={setLinks}
          >
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(1);
        expect(linkCount).toBe(1);
      });

      // Concurrent updates
      act(() => {
        setElementsExternal?.(
          createElements([
            { id: '1', width: 100, height: 100, type: 'ReactElement' },
            { id: '2', width: 200, height: 200, type: 'ReactElement' },
          ])
        );
        setLinksExternal?.([
          new dia.Link({
            id: 'link1',
            type: 'standard.Link',
            source: { id: '1' },
            target: { id: '2' },
          }),
          new dia.Link({
            id: 'link2',
            type: 'standard.Link',
            source: { id: '2' },
            target: { id: '1' },
          }),
        ]);
      });

      await waitFor(
        () => {
          expect(elementCount).toBe(2);
          expect(linkCount).toBe(2);
        },
        { timeout: 3000 }
      );
    });

    it('should handle multiple rapid updates with callbacks', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);

      let elementCount = 0;

      function TestComponent() {
        const count = useElements((items) => items.length);
        elementCount = count;
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);

        const handleAddElement = useCallback(() => {
          setElements((previous) => [
            ...previous,
            {
              id: String(previous.length + 1),
              width: 100 * (previous.length + 1),
              height: 100 * (previous.length + 1),
              type: 'ReactElement' as const,
            },
          ]);
        }, []);

        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
            <button type="button" onClick={handleAddElement}>
              Add Element
            </button>
          </GraphProvider>
        );
      }

      const { getByRole } = render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(1);
      });

      // Rapid button clicks
      const button = getByRole('button');
      act(() => {
        for (let index = 0; index < 5; index++) {
          button.click();
        }
      });

      await waitFor(
        () => {
          expect(elementCount).toBe(6);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('User interaction sync back to React state', () => {
    it('should sync graph changes back to React state in controlled mode', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);

      let reactStateElements: GraphElement[] = [];
      let storeElements: GraphElement[] = [];

      function TestComponent() {
        storeElements = useElements((items) => items);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);
        reactStateElements = elements;

        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
            <UserInteractionComponent />
          </GraphProvider>
        );
      }

      function UserInteractionComponent() {
        const graph = useGraph();

        const handleAddElement = useCallback(() => {
          // Simulate user interaction - directly modify graph
          graph.addCell(
            new dia.Element({
              id: '2',
              type: 'ReactElement',
              position: { x: 200, y: 200 },
              size: { width: 200, height: 200 },
            })
          );
        }, [graph]);

        return (
          <button type="button" onClick={handleAddElement}>
            Add via Graph
          </button>
        );
      }

      const { getByRole } = render(<ControlledGraph />);

      await waitFor(() => {
        expect(reactStateElements.length).toBe(1);
        expect(storeElements.length).toBe(1);
      });

      // Simulate user interaction
      act(() => {
        getByRole('button').click();
      });

      // Graph change should sync back to React state
      await waitFor(
        () => {
          expect(reactStateElements.length).toBe(2);
          expect(storeElements.length).toBe(2);
          expect(reactStateElements.some((element) => element.id === '2')).toBe(true);
          expect(storeElements.some((element) => element.id === '2')).toBe(true);
        },
        { timeout: 3000 }
      );
    });

    it('should handle element position changes from user interaction', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, x: 0, y: 0, type: 'ReactElement' },
      ]);

      let reactStateElements: GraphElement[] = [];

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);
        reactStateElements = elements;

        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <UserInteractionComponent />
          </GraphProvider>
        );
      }

      function UserInteractionComponent() {
        const graph = useGraph();

        const handleMoveElement = useCallback(() => {
          // Simulate user dragging - directly modify graph
          const cell = graph.getCell('1');
          if (cell) {
            cell.set('position', { x: 100, y: 100 });
          }
        }, [graph]);

        return (
          <button type="button" onClick={handleMoveElement}>
            Move Element
          </button>
        );
      }

      const { getByRole } = render(<ControlledGraph />);

      await waitFor(() => {
        expect(reactStateElements.length).toBe(1);
        expect(reactStateElements[0]?.x).toBe(0);
        expect(reactStateElements[0]?.y).toBe(0);
      });

      // Simulate user interaction
      act(() => {
        getByRole('button').click();
      });

      // Graph change should sync back to React state
      await waitFor(
        () => {
          expect(reactStateElements.length).toBe(1);
          expect(reactStateElements[0]?.x).toBe(100);
          expect(reactStateElements[0]?.y).toBe(100);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty arrays correctly', async () => {
      const initialElements = createElements([
        { id: '1', width: 100, height: 100, type: 'ReactElement' },
      ]);

      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.length);
        return null;
      }

      let setElementsExternal: ((elements: GraphElement[]) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState(initialElements);
        setElementsExternal = setElements as (elements: GraphElement[]) => void;
        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(1);
      });

      // Clear all elements
      act(() => {
        setElementsExternal?.([]);
      });

      await waitFor(() => {
        expect(elementCount).toBe(0);
      });

      // Add elements back
      act(() => {
        setElementsExternal?.(
          createElements([
            { id: '1', width: 100, height: 100, type: 'ReactElement' },
            { id: '2', width: 200, height: 200, type: 'ReactElement' },
          ])
        );
      });

      await waitFor(() => {
        expect(elementCount).toBe(2);
      });
    });

    it('should handle undefined elements/links gracefully', async () => {
      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.length);
        linkCount = useLinks((items) => items.length);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<GraphElement[]>([]);
        const [links, setLinks] = useState<dia.Link[]>([]);
        return (
          <GraphProvider
            elements={elements}
            onElementsChange={setElements}
            links={links}
            onLinksChange={setLinks}
          >
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(elementCount).toBe(0);
        expect(linkCount).toBe(0);
      });
    });
  });
});
