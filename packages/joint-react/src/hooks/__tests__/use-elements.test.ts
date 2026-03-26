import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useElementsData } from '../use-elements-data';

describe('use-elements', () => {
  const wrapper = graphProviderWrapper({
    elements: {
      '1': {
        data: {},
        width: 97,
        height: 99,
      },
      '2': {
        data: {},
        width: 97,
        height: 99,
      },
    },
    links: {
      '3': {
        data: {},
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
        return useElementsData();
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalled();
      expect(result.current.size).toBe(2);
      expect(result.current.get('1')?.width).toBe(97);
      expect(result.current.get('1')?.height).toBe(99);

      expect(result.current.get('2')?.width).toBe(97);
      expect(result.current.get('2')?.height).toBe(99);
    });
  });

  it('should get elements properly with selector', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        // eslint-disable-next-line sonarjs/no-nested-functions
        return useElementsData((elements) => [...elements.values()].map((item) => item.width));
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalled();
      expect(result.current.length).toBe(2);
      expect(result.current[0]).toBe(97);
      expect(result.current[1]).toBe(97);
    });
  });
});
