import { highlighters, type dia } from '@joint/core';
import { render, waitFor } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { useHighlighter } from '../use-highlighter';
import { getTestGraph, paperRenderElementWrapper } from '../../utils/test-wrappers';

const TEST_GRAPH_ELEMENTS = {
  'element-1': {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  },
};

function getWrapper() {
  const graph = getTestGraph();
  return paperRenderElementWrapper({
    graphProviderProps: {
      graph,
      elements: TEST_GRAPH_ELEMENTS,
    },
  });
}

function MaskTarget({ isEnabled = true }: Readonly<{ isEnabled?: boolean }>) {
  const targetRef = useRef<SVGGElement | null>(null);
  const { ref } = useHighlighter({
    type: 'mask',
    padding: 2,
    isEnabled,
    ref: targetRef,
  });

  return <g ref={ref} />;
}

let usesConfigRef = false;

function MaskTargetWithConfigRef() {
  const externalRef = useRef<SVGGElement | null>(null);
  const { ref } = useHighlighter({
    type: 'mask',
    padding: 2,
    ref: externalRef,
  });
  useEffect(() => {
    usesConfigRef = ref === externalRef && externalRef.current !== null;
  }, [ref, externalRef]);

  return <g ref={ref} />;
}

describe('useHighlighter', () => {
  it('adds and removes mask highlighter with lifecycle', async () => {
    const addSpy = jest.spyOn(highlighters.mask, 'add');
    const wrapper = getWrapper();
    const { unmount } = render(<MaskTarget />, { wrapper });

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalled();
    });

    const instance = addSpy.mock.results[0]?.value as dia.HighlighterView;
    const removeSpy = jest.spyOn(instance, 'remove');

    unmount();

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  it('supports custom highlighter create callback', async () => {
    const createSpy = jest.fn(
        ({
          cellView,
          element,
          highlighterId,
          options,
        }: {
          readonly cellView: dia.CellView;
          readonly element: dia.HighlighterView.NodeSelector | Record<string, unknown>;
          readonly highlighterId: string;
          readonly options: dia.HighlighterView.Options;
        }) => highlighters.mask.add(cellView, element, highlighterId, options)
    );

    function CustomTarget() {
      const targetRef = useRef<SVGGElement | null>(null);
      const { ref } = useHighlighter({
        type: 'custom',
        padding: 3,
        create: createSpy,
        ref: targetRef,
      });
      return <g ref={ref} />;
    }

    const wrapper = getWrapper();
    render(<CustomTarget />, { wrapper });

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('cleans up when isEnabled changes to false', async () => {
    const addSpy = jest.spyOn(highlighters.mask, 'add');

    const wrapper = getWrapper();
    const { rerender } = render(<MaskTarget isEnabled={true} />, { wrapper });

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalled();
    });

    const instance = addSpy.mock.results[0]?.value as dia.HighlighterView;
    const removeSpy = jest.spyOn(instance, 'remove');

    rerender(<MaskTarget isEnabled={false} />);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  it('uses a ref provided inside config', async () => {
    const addSpy = jest.spyOn(highlighters.mask, 'add');
    usesConfigRef = false;
    const wrapper = getWrapper();
    render(<MaskTargetWithConfigRef />, { wrapper });

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(usesConfigRef).toBe(true);
    });
  });
});
