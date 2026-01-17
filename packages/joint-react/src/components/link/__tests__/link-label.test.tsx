/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { render, waitFor, act } from '@testing-library/react';
import { getTestGraph, paperRenderLinkWrapper } from '../../../utils/test-wrappers';
import type { dia } from '@joint/core';
import { LinkLabel } from '../link-label';

interface LinkLabelWithId extends dia.Link.Label {
  readonly labelId: string;
}

function isLabelPosition(
  position: number | dia.LinkView.LabelOptions | undefined
): position is dia.LinkView.LabelOptions {
  // eslint-disable-next-line sonarjs/different-types-comparison
  return typeof position === 'object' && position !== null;
}

function getLabelPosition(label: LinkLabelWithId): dia.LinkView.LabelOptions {
  const { position } = label;
  if (!isLabelPosition(position)) {
    throw new Error('Expected label position to be an object');
  }
  return position;
}

describe('LinkLabel', () => {
  const getTestWrapper = () => {
    const graph = getTestGraph();
    return {
      graph,
      wrapper: paperRenderLinkWrapper({
        graphProviderProps: {
          graph,
          elements: [
            {
              id: 'element-1',
              x: 0,
              y: 0,
              width: 100,
              height: 100,
            },
            {
              id: 'element-2',
              x: 200,
              y: 200,
              width: 100,
              height: 100,
            },
          ],
          links: [
            {
              id: 'link-1',
              source: 'element-1',
              target: 'element-2',
            },
          ],
        },
      }),
    };
  };

  describe('mount and unmount', () => {
    it('should create label on mount', async () => {
      const { graph, wrapper } = getTestWrapper();
      render(
        <LinkLabel distance={0.5}>
          <text>Test Label</text>
        </LinkLabel>,
        { wrapper }
      );

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        expect(labels.length).toBe(1);
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).distance).toBe(0.5);
        expect(label.labelId).toBeDefined();
      });
    });

    it('should remove label on unmount', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { unmount } = render(
        <LinkLabel distance={0.5}>
          <text>Test Label</text>
        </LinkLabel>,
        { wrapper }
      );

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        expect(link.labels().length).toBe(1);
      });

      unmount();

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        expect(link.labels().length).toBe(0);
      });
    });
  });

  describe('prop updates', () => {
    it('should update distance when prop changes', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { rerender } = render(<LinkLabel distance={0.3} />, { wrapper });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        expect(labels.length).toBe(1);
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).distance).toBe(0.3);
      });

      rerender(<LinkLabel distance={0.7} />);

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        expect(labels.length).toBe(1);
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).distance).toBe(0.7);
      });
    });

    it('should update offset when prop changes', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { rerender } = render(<LinkLabel distance={0.5} offset={10} />, { wrapper });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).offset).toBe(10);
      });

      rerender(<LinkLabel distance={0.5} offset={{ x: 20, y: 30 }} />);

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).offset).toEqual({ x: 20, y: 30 });
      });
    });

    it('should update angle when prop changes', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { rerender } = render(<LinkLabel distance={0.5} angle={0} />, { wrapper });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).angle).toBe(0);
      });

      rerender(<LinkLabel distance={0.5} angle={45} />);

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).angle).toBe(45);
      });
    });

    it('should update attrs when prop changes', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { rerender } = render(
        <LinkLabel distance={0.5} attrs={{ text: { text: 'Label 1' } }} />,
        { wrapper }
      );

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(label.attrs?.text?.text).toBe('Label 1');
      });

      rerender(<LinkLabel distance={0.5} attrs={{ text: { text: 'Label 2' } }} />);

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(label.attrs?.text?.text).toBe('Label 2');
      });
    });

    it('should update size when prop changes', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { rerender } = render(<LinkLabel distance={0.5} size={{ width: 50, height: 20 }} />, {
        wrapper,
      });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(label.size?.width).toBe(50);
        expect(label.size?.height).toBe(20);
      });

      rerender(<LinkLabel distance={0.5} size={{ width: 100, height: 40 }} />);

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(label.size?.width).toBe(100);
        expect(label.size?.height).toBe(40);
      });
    });

    it('should update args when prop changes', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { rerender } = render(<LinkLabel distance={0.5} args={{ absoluteDistance: true }} />, {
        wrapper,
      });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).args?.absoluteDistance).toBe(true);
      });

      rerender(<LinkLabel distance={0.5} args={{ absoluteDistance: false }} />);

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).args?.absoluteDistance).toBe(false);
      });
    });

    it('should update multiple props together', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { rerender } = render(
        <LinkLabel distance={0.3} offset={10} angle={0} attrs={{ text: { text: 'A' } }} />,
        { wrapper }
      );

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        const position = getLabelPosition(label);
        expect(position.distance).toBe(0.3);
        expect(position.offset).toBe(10);
        expect(position.angle).toBe(0);
        expect(label.attrs?.text?.text).toBe('A');
      });

      rerender(<LinkLabel distance={0.7} offset={20} angle={90} attrs={{ text: { text: 'B' } }} />);

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        const position = getLabelPosition(label);
        expect(position.distance).toBe(0.7);
        expect(position.offset).toBe(20);
        expect(position.angle).toBe(90);
        expect(label.attrs?.text?.text).toBe('B');
      });
    });
  });

  describe('render optimization', () => {
    it('should not create duplicate labels when props change', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { rerender } = render(<LinkLabel distance={0.5} />, { wrapper });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        expect(link.labels().length).toBe(1);
      });

      // Update props multiple times
      rerender(<LinkLabel distance={0.6} />);
      rerender(<LinkLabel distance={0.7} />);
      rerender(<LinkLabel distance={0.8} />);

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        // Should still have only one label
        expect(link.labels().length).toBe(1);
        const label = link.labels()[0] as LinkLabelWithId;
        expect(getLabelPosition(label).distance).toBe(0.8);
      });
    });

    it('should not re-create label when stable props change', async () => {
      const { graph, wrapper } = getTestWrapper();
      let renderCount = 0;
      const TestComponent = () => {
        renderCount++;
        return <LinkLabel distance={0.5}>Test</LinkLabel>;
      };

      const { rerender } = render(<TestComponent />, { wrapper });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        expect(link.labels().length).toBe(1);
      });

      // Get the initial labelId
      const link = graph.getCell('link-1');
      if (!link || !link.isLink()) {
        throw new Error('Link not found');
      }
      const initialLabelId = (link.labels()[0] as LinkLabelWithId).labelId;

      // Update props that should trigger update effect, not create effect
      act(() => {
        rerender(<TestComponent />);
      });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        // Label should still exist with same labelId
        const labels = link.labels();
        expect(labels.length).toBe(1);
        const label = labels[0] as LinkLabelWithId;
        expect(label.labelId).toBe(initialLabelId);
      });

      // Component may re-render, but label should not be recreated
      expect(link.labels().length).toBe(1);
    });

    it('should only create label once on mount, then update on prop changes', async () => {
      const { graph, wrapper } = getTestWrapper();
      const { rerender } = render(<LinkLabel distance={0.5} />, { wrapper });

      // Wait for link to be available and label to be created
      await waitFor(() => {
        const foundLink = graph.getCell('link-1');
        if (!foundLink || !foundLink.isLink()) {
          throw new Error('Link not found');
        }
        expect(foundLink.labels().length).toBe(1);
      });

      const link = graph.getCell('link-1');
      if (!link || !link.isLink()) {
        throw new Error('Link not found');
      }

      // Get the initial labelId to verify it's the same label being updated
      const initialLabelId = (link.labels()[0] as LinkLabelWithId).labelId;

      // Update props - should trigger update effect, not create effect
      rerender(<LinkLabel distance={0.6} />);
      await waitFor(() => {
        const labels = link!.labels();
        expect(labels.length).toBe(1);
        const label = labels[0] as LinkLabelWithId;
        expect(label.labelId).toBe(initialLabelId); // Same label, not a new one
        expect(getLabelPosition(label).distance).toBe(0.6);
      });

      // Update again
      rerender(<LinkLabel distance={0.7} />);
      await waitFor(() => {
        const labels = link!.labels();
        expect(labels.length).toBe(1);
        const label = labels[0] as LinkLabelWithId;
        expect(label.labelId).toBe(initialLabelId); // Still the same label
        expect(getLabelPosition(label).distance).toBe(0.7);
      });

      // Should still have only one label
      const finalLink = graph.getCell('link-1');
      if (!finalLink || !finalLink.isLink()) {
        throw new Error('Link not found');
      }
      expect(finalLink.labels().length).toBe(1);
      const finalLabel = finalLink.labels()[0] as LinkLabelWithId;
      expect(finalLabel.labelId).toBe(initialLabelId); // Same label throughout
    });
  });

  describe('edge cases', () => {
    it('should handle ensureLegibility prop', async () => {
      const { graph, wrapper } = getTestWrapper();
      render(<LinkLabel distance={0.5} ensureLegibility={true} />, { wrapper });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).args?.ensureLegibility).toBe(true);
      });
    });

    it('should handle keepGradient prop', async () => {
      const { graph, wrapper } = getTestWrapper();
      render(<LinkLabel distance={0.5} keepGradient={true} />, { wrapper });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        const label = labels[0] as LinkLabelWithId;
        expect(getLabelPosition(label).args?.keepGradient).toBe(true);
      });
    });

    it('should handle undefined optional props', async () => {
      const { graph, wrapper } = getTestWrapper();
      render(<LinkLabel distance={0.5} />, { wrapper });

      await waitFor(() => {
        const link = graph.getCell('link-1');
        if (!link || !link.isLink()) {
          throw new Error('Link not found');
        }
        const labels = link.labels();
        expect(labels.length).toBe(1);
        const label = labels[0] as LinkLabelWithId;
        const position = getLabelPosition(label);
        expect(position.distance).toBe(0.5);
        // Optional props should be undefined or have defaults
        expect(position.offset).toBeUndefined();
        expect(position.angle).toBeUndefined();
      });
    });
  });
});
