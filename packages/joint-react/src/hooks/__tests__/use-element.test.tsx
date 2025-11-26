import { renderHook, waitFor } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { useElement } from '../use-element';

describe('use-element', () => {
  const wrapper = paperRenderElementWrapper({
    graphProviderProps: {
      elements: [
        {
          id: '1',
          width: 100,
          height: 100,
          x: 10,
          y: 20,
        },
      ],
    },
    paperProps: {
      renderElement: () => <rect />,
    },
  });

  it('should get element without selector', async () => {
    const { result } = renderHook(
      () => {
        return useElement();
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.id).toBe('1');
      expect(result.current.width).toBe(100);
      expect(result.current.height).toBe(100);
    });
  });

  it('should get element with selector', async () => {
    const { result } = renderHook(
      () => {
        return useElement((element) => element.width);
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current).toBe(100);
    });
  });

  it('should get element with custom isEqual', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useElement(
          (element) => element,
          (previous, next) => previous.width === next.width
        );
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      expect(result.current.width).toBe(100);
    });
  });
});
