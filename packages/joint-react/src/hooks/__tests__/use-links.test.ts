import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useLinks } from '../use-links';

describe('use-links', () => {
  const wrapper = graphProviderWrapper({
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
    initialLinks: [
      {
        id: '3',
        source: '1',
        target: '2',
      },
    ],
  });

  it('should get elements properly without selector', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useLinks();
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(2);
      expect(result.current.length).toBe(1);
      expect(result.current[0].id).toBe('3');
    });
  });

  it('should get elements properly with selector', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        // @ts-expect-error - We are testing the selector functionality
        // eslint-disable-next-line sonarjs/no-nested-functions
        return useLinks((element) => element.map((items) => items.source.id));
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(2);
      expect(result.current.length).toBe(1);
      expect(result.current[0]).toBe('1');
    });
  });
});
