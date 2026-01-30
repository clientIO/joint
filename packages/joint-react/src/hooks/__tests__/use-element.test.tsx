import { renderHook, waitFor } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { useElement } from '../use-element';

describe('use-element', () => {
  const wrapper = paperRenderElementWrapper({
    graphProviderProps: {
      elements: {
        '1': {
          width: 100,
          height: 100,
          x: 10,
          y: 20,
        },
      },
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
      expect(result.current.width).toBe(100);
      expect(result.current.height).toBe(100);
    });
  });
});









