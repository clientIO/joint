/* eslint-disable unicorn/consistent-function-scoping */
import { render, waitFor } from '@testing-library/react';
import { getTestGraph, paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { highlighters, type dia } from '@joint/core';
import { Mask } from '../mask';
import { Stroke } from '../stroke';
import { Opacity } from '../opacity';

describe('Highlighter cleanup', () => {
  const getTestWrapper = () => {
    const graph = getTestGraph();
    return {
      graph,
      wrapper: paperRenderElementWrapper({
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
          ],
        },
      }),
    };
  };

  describe('Mask highlighter', () => {
    it('should add mask highlighter on mount', async () => {
      const { wrapper } = getTestWrapper();
      const addSpy = jest.spyOn(highlighters.mask, 'add');

      render(<Mask />, { wrapper });

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalled();
      });

      addSpy.mockRestore();
    });

    it('should remove mask highlighter on unmount', async () => {
      const { wrapper } = getTestWrapper();
      let highlighterInstance: dia.HighlighterView | null = null;

      const originalAdd = highlighters.mask.add.bind(highlighters.mask);
      jest.spyOn(highlighters.mask, 'add').mockImplementation((...args) => {
        highlighterInstance = originalAdd(...(args as Parameters<typeof originalAdd>));
        return highlighterInstance;
      });

      const { unmount } = render(<Mask />, { wrapper });

      await waitFor(() => {
        expect(highlighterInstance).not.toBeNull();
      });

      const removeSpy = jest.spyOn(highlighterInstance!, 'remove');

      unmount();

      await waitFor(() => {
        expect(removeSpy).toHaveBeenCalled();
      });

      jest.restoreAllMocks();
    });
  });

  describe('Stroke highlighter', () => {
    it('should add stroke highlighter on mount', async () => {
      const { wrapper } = getTestWrapper();
      const addSpy = jest.spyOn(highlighters.stroke, 'add');

      render(<Stroke />, { wrapper });

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalled();
      });

      addSpy.mockRestore();
    });

    it('should remove stroke highlighter on unmount', async () => {
      const { wrapper } = getTestWrapper();
      let highlighterInstance: dia.HighlighterView | null = null;

      const originalAdd = highlighters.stroke.add.bind(highlighters.stroke);
      jest.spyOn(highlighters.stroke, 'add').mockImplementation((...args) => {
        highlighterInstance = originalAdd(...(args as Parameters<typeof originalAdd>));
        return highlighterInstance;
      });

      const { unmount } = render(<Stroke />, { wrapper });

      await waitFor(() => {
        expect(highlighterInstance).not.toBeNull();
      });

      const removeSpy = jest.spyOn(highlighterInstance!, 'remove');

      unmount();

      await waitFor(() => {
        expect(removeSpy).toHaveBeenCalled();
      });

      jest.restoreAllMocks();
    });
  });

  describe('Opacity highlighter', () => {
    it('should add opacity highlighter on mount', async () => {
      const { wrapper } = getTestWrapper();
      const addSpy = jest.spyOn(highlighters.opacity, 'add');

      render(<Opacity alphaValue={0.5} />, { wrapper });

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalled();
      });

      addSpy.mockRestore();
    });

    it('should remove opacity highlighter on unmount', async () => {
      const { wrapper } = getTestWrapper();
      let highlighterInstance: dia.HighlighterView | null = null;

      const originalAdd = highlighters.opacity.add.bind(highlighters.opacity);
      jest.spyOn(highlighters.opacity, 'add').mockImplementation((...args) => {
        highlighterInstance = originalAdd(...(args as Parameters<typeof originalAdd>));
        return highlighterInstance;
      });

      const { unmount } = render(<Opacity alphaValue={0.5} />, { wrapper });

      await waitFor(() => {
        expect(highlighterInstance).not.toBeNull();
      });

      const removeSpy = jest.spyOn(highlighterInstance!, 'remove');

      unmount();

      await waitFor(() => {
        expect(removeSpy).toHaveBeenCalled();
      });

      jest.restoreAllMocks();
    });
  });

  describe('Highlighter with isHidden', () => {
    it('should not add highlighter when isHidden is true', async () => {
      const { wrapper } = getTestWrapper();
      const addSpy = jest.spyOn(highlighters.mask, 'add');

      render(<Mask isHidden={true} />, { wrapper });

      // Wait a bit to ensure it would have been called if it was going to be
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(addSpy).not.toHaveBeenCalled();

      addSpy.mockRestore();
    });

    it('should remove highlighter when isHidden changes to true', async () => {
      const { wrapper } = getTestWrapper();
      let highlighterInstance: dia.HighlighterView | null = null;

      const originalAdd = highlighters.mask.add.bind(highlighters.mask);
      jest.spyOn(highlighters.mask, 'add').mockImplementation((...args) => {
        highlighterInstance = originalAdd(...(args as Parameters<typeof originalAdd>));
        return highlighterInstance;
      });

      const { rerender } = render(<Mask isHidden={false} />, { wrapper });

      await waitFor(() => {
        expect(highlighterInstance).not.toBeNull();
      });

      const removeSpy = jest.spyOn(highlighterInstance!, 'remove');

      // Hide the highlighter
      rerender(<Mask isHidden={true} />);

      await waitFor(() => {
        expect(removeSpy).toHaveBeenCalled();
      });

      jest.restoreAllMocks();
    });
  });
});
