import { renderHook, waitFor } from '@testing-library/react';
import { useElement } from '../use-element';
import { simpleRenderElementWrapper } from '../../utils/test-wrappers';

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
});
