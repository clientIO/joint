/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/no-identical-functions */
import React, { useState, useCallback } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { useElements, useLinks, useGraph } from '../../../hooks';
import type { MixedElementRecord, MixedLinkRecord } from '../../../types/data-types';
import { GraphProvider } from '../../graph/graph-provider';

describe('GraphProvider Controlled Mode', () => {
  describe('Basic useState integration', () => {
    it('should sync React state to store and graph on initial mount', async () => {
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 } },
        '2': { size: { width: 200, height: 200 } },
      };

      let elementCount = 0;
      let elementIds: string[] = [];

      function TestComponent() {
        const elements = useElements((items) => [...items.values()]);
        elementCount = elements.length;
        elementIds = [...useElements((items) => items).keys()];
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
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
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 } },
      };

      let elementCount = 0;
      let elementIds: string[] = [];

      function TestComponent() {
        const elements = useElements((items) => [...items.values()]);
        elementCount = elements.length;
        elementIds = [...useElements((items) => items).keys()];
        return null;
      }

      let setElementsExternal: ((elements: Record<string, MixedElementRecord>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
        setElementsExternal = setElements as (elements: Record<string, MixedElementRecord>) => void;
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
          '1': { size: { width: 100, height: 100 } },
          '2': { size: { width: 200, height: 200 } },
          '3': { size: { width: 300, height: 300 } },
        });
      });

      await waitFor(() => {
        expect(elementCount).toBe(3);
        expect(elementIds).toEqual(['1', '2', '3']);
      });
    });

    it('should handle both elements and links in controlled mode', async () => {
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 } },
      };
      const initialLink: MixedLinkRecord = {
        source: '1',
        target: '2',
      };

      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.size);
        linkCount = useLinks((items) => items.size);
        return null;
      }

      let setElementsExternal: ((elements: Record<string, MixedElementRecord>) => void) | null = null;
      let setLinksExternal: ((links: Record<string, MixedLinkRecord>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
        const [links, setLinks] = useState<Record<string, MixedLinkRecord>>(() => ({
          link1: initialLink,
        }));
        setElementsExternal = setElements as (elements: Record<string, MixedElementRecord>) => void;
        setLinksExternal = setLinks as (links: Record<string, MixedLinkRecord>) => void;
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
          '1': { size: { width: 100, height: 100 } },
          '2': { size: { width: 200, height: 200 } },
        });
      });

      await waitFor(() => {
        expect(elementCount).toBe(2);
        expect(linkCount).toBe(1); // Links should be preserved
      });

      // Update links only
      act(() => {
        setLinksExternal?.({
          link1: {
            source: '1',
            target: '2',
          },
          link2: {
            source: '2',
            target: '1',
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
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 } },
      };

      let elementCount = 0;

      function TestComponent() {
        const count = useElements((items) => items.size);
        elementCount = count;
        return null;
      }

      let setElementsExternal: ((elements: Record<string, MixedElementRecord>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
        setElementsExternal = setElements as (elements: Record<string, MixedElementRecord>) => void;
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
          '1': { size: { width: 100, height: 100 } },
          '2': { size: { width: 200, height: 200 } },
        });
        setElementsExternal?.({
          '1': { size: { width: 100, height: 100 } },
          '2': { size: { width: 200, height: 200 } },
          '3': { size: { width: 300, height: 300 } },
        });
        setElementsExternal?.({
          '1': { size: { width: 100, height: 100 } },
          '2': { size: { width: 200, height: 200 } },
          '3': { size: { width: 300, height: 300 } },
          '4': { size: { width: 400, height: 400 } },
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
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 } },
      };

      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.size);
        return null;
      }

      let setElementsExternal: ((elements: Record<string, MixedElementRecord>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
        setElementsExternal = setElements as (elements: Record<string, MixedElementRecord>) => void;
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
          const newElements: Record<string, MixedElementRecord> = {};
          for (let elementIndex = 1; elementIndex <= index; elementIndex++) {
            newElements[String(elementIndex)] = {
              size: { width: 100 * elementIndex, height: 100 * elementIndex },
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
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 } },
      };
      const initialLink: MixedLinkRecord = {
        source: '1',
        target: '2',
      };

      let elementCount = 0;
      let linkCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.size);
        linkCount = useLinks((items) => items.size);
        return null;
      }

      let setElementsExternal: ((elements: Record<string, MixedElementRecord>) => void) | null = null;
      let setLinksExternal: ((links: Record<string, MixedLinkRecord>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
        const [links, setLinks] = useState<Record<string, MixedLinkRecord>>(() => ({
          link1: initialLink,
        }));
        setElementsExternal = setElements as (elements: Record<string, MixedElementRecord>) => void;
        setLinksExternal = setLinks as (links: Record<string, MixedLinkRecord>) => void;
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
          '1': { size: { width: 100, height: 100 } },
          '2': { size: { width: 200, height: 200 } },
        });
        setLinksExternal?.({
          link1: {
            source: '1',
            target: '2',
          },
          link2: {
            source: '2',
            target: '1',
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
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 } },
      };

      let elementCount = 0;

      function TestComponent() {
        const count = useElements((items) => items.size);
        elementCount = count;
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);

        const handleAddElement = useCallback(() => {
          setElements((previous) => {
            const newId = String(Object.keys(previous).length + 1);
            return {
              ...previous,
              [newId]: {
                size: { width: 100 * (Object.keys(previous).length + 1), height: 100 * (Object.keys(previous).length + 1) },
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
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 } },
      };

      let reactStateElements: Record<string, MixedElementRecord> = {};
      let storeElements: Map<string, MixedElementRecord> = new Map();

      function TestComponent() {
        storeElements = useElements((items) => items);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
        reactStateElements = elements;

        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
            <UserInteractionComponent />
          </GraphProvider>
        );
      }

      function UserInteractionComponent() {
        const { graph } = useGraph();

        const handleAddElement = useCallback(() => {
          // Simulate user interaction - directly modify graph
          graph.addCell(
            new dia.Element({
              id: '2',
              type: 'PortalElement',
              position: { x: 200, y: 200 },
              size: { size: { width: 200, height: 200 } },
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
        expect(storeElements.size).toBe(1);
      });

      // Simulate user interaction
      act(() => {
        getByRole('button').click();
      });

      // Graph change should sync back to React state
      await waitFor(
        () => {
          expect(Object.keys(reactStateElements).length).toBe(2);
          expect(storeElements.size).toBe(2);
          expect(reactStateElements['2']).toBeDefined();
          expect(storeElements.get('2')).toBeDefined();
        },
        { timeout: 3000 }
      );
    });

    it('should handle element position changes from user interaction', async () => {
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 }, position: { x: 0, y: 0 } },
      };

      let reactStateElements: Record<string, MixedElementRecord> = {};

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
        reactStateElements = elements;

        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <UserInteractionComponent />
          </GraphProvider>
        );
      }

      function UserInteractionComponent() {
        const { graph } = useGraph();

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
        expect(reactStateElements['1']?.position?.x).toBe(0);
        expect(reactStateElements['1']?.position?.y).toBe(0);
      });

      // Simulate user interaction
      act(() => {
        getByRole('button').click();
      });

      // Graph change should sync back to React state
      await waitFor(
        () => {
          expect(Object.keys(reactStateElements).length).toBe(1);
          expect(reactStateElements['1']?.position?.x).toBe(100);
          expect(reactStateElements['1']?.position?.y).toBe(100);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('React state to graph position sync', () => {
    it('should update graph position when React state x,y changes via setElements', async () => {
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 }, position: { x: 0, y: 0 } },
      };

      let reactStateElements: Record<string, MixedElementRecord> = {};
      let graphRef: dia.Graph | null = null;

      function TestComponent() {
        const { graph } = useGraph();
        graphRef = graph;
        return null;
      }

      let setElementsExternal: ((elements: Record<string, MixedElementRecord>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
        reactStateElements = elements;
        setElementsExternal = setElements as (elements: Record<string, MixedElementRecord>) => void;
        return (
          <GraphProvider elements={elements} onElementsChange={setElements}>
            <TestComponent />
          </GraphProvider>
        );
      }

      render(<ControlledGraph />);

      await waitFor(() => {
        expect(reactStateElements['1']?.position?.x).toBe(0);
        expect(reactStateElements['1']?.position?.y).toBe(0);
        expect(graphRef).not.toBeNull();
      });

      // Update position via React state
      act(() => {
        setElementsExternal?.({
          '1': { size: { width: 100, height: 100 }, position: { x: 150, y: 250 } },
        });
      });

      // Graph should reflect the new position
      await waitFor(
        () => {
          const cell = graphRef!.getCell('1');
          expect(cell).toBeDefined();
          expect(cell!.get('position')).toEqual({ x: 150, y: 250 });
          // React state should also reflect it
          expect(reactStateElements['1']?.position?.x).toBe(150);
          expect(reactStateElements['1']?.position?.y).toBe(250);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty records correctly', async () => {
      const initialElements: Record<string, MixedElementRecord> = {
        '1': { size: { width: 100, height: 100 } },
      };

      let elementCount = 0;

      function TestComponent() {
        elementCount = useElements((items) => items.size);
        return null;
      }

      let setElementsExternal: ((elements: Record<string, MixedElementRecord>) => void) | null = null;

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>(() => initialElements);
        setElementsExternal = setElements as (elements: Record<string, MixedElementRecord>) => void;
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
          '1': { size: { width: 100, height: 100 } },
          '2': { size: { width: 200, height: 200 } },
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
        elementCount = useElements((items) => items.size);
        linkCount = useLinks((items) => items.size);
        return null;
      }

      function ControlledGraph() {
        const [elements, setElements] = useState<Record<string, MixedElementRecord>>({});
        const [links, setLinks] = useState<Record<string, MixedLinkRecord>>({});
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
