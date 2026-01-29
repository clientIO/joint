/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/no-identical-functions */
import React, { useState, useCallback } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { useElements, useLinks, useGraph } from '../../../hooks';
import type { GraphElement } from '../../../types/element-types';
import type { GraphLink } from '../../../types/link-types';
import { GraphProvider } from '../../graph/graph-provider';

describe('GraphProvider Controlled Mode', () => {
  describe('Basic useState integration', () => {
    it('should sync React state to store and graph on initial mount', async () => {
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100 },
        '2': { width: 200, height: 200 },
      };

      let elementCount = 0;
      let elementIds: string[] = [];

      function TestComponent() {
        const elements = useElements((items) => Object.values(items));
        elementCount = elements.length;
        elementIds = Object.keys(useElements((items) => items));
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
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
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100 },
      };

      let elementCount = 0;
      let elementIds: string[] = [];

      function TestComponent() {
        const elements = useElements((items) => Object.values(items));
        elementCount = elements.length;
        elementIds = Object.keys(useElements((items) => items));
        return null;
      }

      let setElementsExternal: ((elements: Record<string, GraphElement>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
        setElementsExternal = setElements as (elements: Record<string, GraphElement>) => void;
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
        setElementsExternal?.({
          '1': { width: 100, height: 100 },
          '2': { width: 200, height: 200 },
          '3': { width: 300, height: 300 },
        });
      });

      await waitFor(() => {
        expect(elementCount).toBe(3);
        expect(elementIds).toEqual(['1', '2', '3']);
      });
    });

    it('should handle both elements and links in controlled mode', async () => {
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100 },
      };
      const initialLink: GraphLink = {
        type: 'standard.Link',
        source: { id: '1' },
        target: { id: '2' },
      };

      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => Object.keys(items).length);
        linkCount = useLinks((items) => Object.keys(items).length);
        return null;
      }

      let setElementsExternal: ((elements: Record<string, GraphElement>) => void) | null = null;
      let setLinksExternal: ((links: Record<string, GraphLink>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
        const [links, setLinks] = useState<Record<string, GraphLink>>(() => ({
          'link1': initialLink,
        }));
        setElementsExternal = setElements as (elements: Record<string, GraphElement>) => void;
        setLinksExternal = setLinks as (links: Record<string, GraphLink>) => void;
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
        setElementsExternal?.({
          '1': { width: 100, height: 100 },
          '2': { width: 200, height: 200 },
        });
      });

      await waitFor(() => {
        expect(elementCount).toBe(2);
        expect(linkCount).toBe(1); // Links should be preserved
      });

      // Update links only
      act(() => {
        setLinksExternal?.({
          'link1': {
            type: 'standard.Link',
            source: { id: '1' },
            target: { id: '2' },
          },
          'link2': {
            type: 'standard.Link',
            source: { id: '2' },
            target: { id: '1' },
          },
        });
      });

      await waitFor(() => {
        expect(elementCount).toBe(2); // Elements should be preserved
        expect(linkCount).toBe(2);
      });
    });
  });

  describe('Rapid consecutive updates', () => {
    it('should handle rapid consecutive state updates correctly', async () => {
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100 },
      };

      let elementCount = 0;

      function TestComponent() {
        const count = useElements((items) => Object.keys(items).length);
        elementCount = count;
        return null;
      }

      let setElementsExternal: ((elements: Record<string, GraphElement>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
        setElementsExternal = setElements as (elements: Record<string, GraphElement>) => void;
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
        setElementsExternal?.({
          '1': { width: 100, height: 100 },
          '2': { width: 200, height: 200 },
        });
        setElementsExternal?.({
          '1': { width: 100, height: 100 },
          '2': { width: 200, height: 200 },
          '3': { width: 300, height: 300 },
        });
        setElementsExternal?.({
          '1': { width: 100, height: 100 },
          '2': { width: 200, height: 200 },
          '3': { width: 300, height: 300 },
          '4': { width: 400, height: 400 },
        });
      });

      await waitFor(
        () => {
          expect(elementCount).toBe(4);
        },
        { timeout: 3000 }
      );
    });

    it('should handle 10 rapid updates without losing state', async () => {
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100 },
      };

      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => Object.keys(items).length);
        return null;
      }

      let setElementsExternal: ((elements: Record<string, GraphElement>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
        setElementsExternal = setElements as (elements: Record<string, GraphElement>) => void;
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
          const newElements: Record<string, GraphElement> = {};
          for (let elementIndex = 1; elementIndex <= index; elementIndex++) {
            newElements[String(elementIndex)] = {
              width: 100 * elementIndex,
              height: 100 * elementIndex,
            };
          }
          setElementsExternal?.(newElements);
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
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100 },
      };
      const initialLink: GraphLink = {
        type: 'standard.Link',
        source: { id: '1' },
        target: { id: '2' },
      };

      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => Object.keys(items).length);
        linkCount = useLinks((items) => Object.keys(items).length);
        return null;
      }

      let setElementsExternal: ((elements: Record<string, GraphElement>) => void) | null = null;
      let setLinksExternal: ((links: Record<string, GraphLink>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
        const [links, setLinks] = useState<Record<string, GraphLink>>(() => ({
          'link1': initialLink,
        }));
        setElementsExternal = setElements as (elements: Record<string, GraphElement>) => void;
        setLinksExternal = setLinks as (links: Record<string, GraphLink>) => void;
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
        setElementsExternal?.({
          '1': { width: 100, height: 100 },
          '2': { width: 200, height: 200 },
        });
        setLinksExternal?.({
          'link1': {
            type: 'standard.Link',
            source: { id: '1' },
            target: { id: '2' },
          },
          'link2': {
            type: 'standard.Link',
            source: { id: '2' },
            target: { id: '1' },
          },
        });
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
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100 },
      };

      let elementCount = 0;

      function TestComponent() {
        const count = useElements((items) => Object.keys(items).length);
        elementCount = count;
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);

        const handleAddElement = useCallback(() => {
          setElements((previous) => {
            const newId = String(Object.keys(previous).length + 1);
            return {
              ...previous,
              [newId]: {
                width: 100 * (Object.keys(previous).length + 1),
                height: 100 * (Object.keys(previous).length + 1),
              },
            };
          });
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
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100 },
      };

      let reactStateElements: Record<string, GraphElement> = {};
      let storeElements: Record<string, GraphElement> = {};

      function TestComponent() {
        storeElements = useElements((items) => items);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
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
        expect(Object.keys(reactStateElements).length).toBe(1);
        expect(Object.keys(storeElements).length).toBe(1);
      });

      // Simulate user interaction
      act(() => {
        getByRole('button').click();
      });

      // Graph change should sync back to React state
      await waitFor(
        () => {
          expect(Object.keys(reactStateElements).length).toBe(2);
          expect(Object.keys(storeElements).length).toBe(2);
          expect(reactStateElements['2']).toBeDefined();
          expect(storeElements['2']).toBeDefined();
        },
        { timeout: 3000 }
      );
    });

    it('should handle element position changes from user interaction', async () => {
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100, x: 0, y: 0 },
      };

      let reactStateElements: Record<string, GraphElement> = {};

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
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
        expect(Object.keys(reactStateElements).length).toBe(1);
        expect(reactStateElements['1']?.x).toBe(0);
        expect(reactStateElements['1']?.y).toBe(0);
      });

      // Simulate user interaction
      act(() => {
        getByRole('button').click();
      });

      // Graph change should sync back to React state
      await waitFor(
        () => {
          expect(Object.keys(reactStateElements).length).toBe(1);
          expect(reactStateElements['1']?.x).toBe(100);
          expect(reactStateElements['1']?.y).toBe(100);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty records correctly', async () => {
      const initialElements: Record<string, GraphElement> = {
        '1': { width: 100, height: 100 },
      };

      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => Object.keys(items).length);
        return null;
      }

      let setElementsExternal: ((elements: Record<string, GraphElement>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
        setElementsExternal = setElements as (elements: Record<string, GraphElement>) => void;
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
        setElementsExternal?.({});
      });

      await waitFor(() => {
        expect(elementCount).toBe(0);
      });

      // Add elements back
      act(() => {
        setElementsExternal?.({
          '1': { width: 100, height: 100 },
          '2': { width: 200, height: 200 },
        });
      });

      await waitFor(() => {
        expect(elementCount).toBe(2);
      });
    });

    it('should handle undefined elements/links gracefully', async () => {
      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => Object.keys(items).length);
        linkCount = useLinks((items) => Object.keys(items).length);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, GraphElement>>({});
        const [links, setLinks] = useState<Record<string, GraphLink>>({});
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
