import { act, renderHook, waitFor } from '@testing-library/react';
import { useElement } from '../use-element';
import { paperRenderElementWrapper, simpleRenderElementWrapper } from '../../utils/test-wrappers';
import { useUpdateElement } from '../use-update-element';
import { useCreateElement } from '../use-create-element';
import type { GraphElement } from '../../types/element-types';

describe('use-element', () => {
  it('should return data from usuElement hook without selector', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useElement();
      },
      {
        wrapper: simpleRenderElementWrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      expect(result.current.id).toBe('1');
      expect(result.current.width).toBe(97);
      expect(result.current.height).toBe(99);
    });
  });
  it('should return data from useElement hook with selector', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useElement((element) => element.width);
      },
      {
        wrapper: simpleRenderElementWrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      expect(result.current).toBe(97);
    });
  });
  it('should return data from useElement hook with selector and isEqual', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useElement(
          (element) => element.width,
          (previous, next) => previous === next
        );
      },
      {
        wrapper: simpleRenderElementWrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      expect(result.current).toBe(97);
    });
  });

  it('should measure use-elements selector - how many count it was called', async () => {
    const wrapper = paperRenderElementWrapper({
      graphProps: {
        initialElements: [
          {
            id: '1',
            width: 97,
            height: 99,
          },
          {
            id: '2',
            width: 97,
            height: 99,
          },
        ],
      },
    });
    const renders = jest.fn();
    let selectorCalls = 0;
    function selector(element: GraphElement) {
      selectorCalls++;
      return element;
    }
    const { result } = renderHook(
      () => {
        renders();
        return {
          element: useElement(selector),
          update: useUpdateElement(),
          create: useCreateElement(),
        };
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(2);
      expect(selectorCalls).toBe(2);
    });

    act(() => {
      result.current.update('1', 'size', {
        width: 100,
        height: 100,
      });
    });

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(3);
      // TODO WE SHOULD HANDLE THIS TO NOT BE CALLED
      // now useElement is part of all data, so when one item is changed, it will be called
      expect(selectorCalls).toBe(4);
    });
  });
});
