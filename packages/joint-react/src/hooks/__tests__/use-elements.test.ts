import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useElements } from '../use-elements';

describe('use-elements', () => {
  const wrapper = graphProviderWrapper({
    elements: {
      '1': {
        width: 97,
        height: 99,
      },
      '2': {
        width: 97,
        height: 99,
      },
    },
    links: {
      '3': {
        source: '1',
        target: '2',
      },
    },
  });

  it('should get elements properly without selector', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useElements();
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      expect(Object.keys(result.current).length).toBe(2);
      expect(result.current['1'].width).toBe(97);
      expect(result.current['1'].height).toBe(99);

      expect(result.current['2'].width).toBe(97);
      expect(result.current['2'].height).toBe(99);
    });
  });

  it('should get elements properly with selector', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        // eslint-disable-next-line sonarjs/no-nested-functions
        return useElements((elements) => Object.values(elements).map((item) => item.width));
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      expect(result.current.length).toBe(2);
      expect(result.current[0]).toBe(97);
      expect(result.current[1]).toBe(97);
    });
  });
});
