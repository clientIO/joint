import { renderHook, waitFor } from '@testing-library/react';
import { paperRenderLinkWrapper } from '../../utils/test-wrappers';
import { useLink } from '../use-link';

describe('useLink', () => {
  const wrapper = paperRenderLinkWrapper({
    graphProviderProps: {
      elements: {
        '1': { x: 0, y: 0, width: 10, height: 10 },
        '2': { x: 100, y: 100, width: 10, height: 10 },
      },
      links: {
        'link-1': { source: '1', target: '2', color: '#FF0000' },
      },
    },
    paperProps: {
      renderLink: () => <line />,
    },
  });

  it('should get link without selector', async () => {
    const { result } = renderHook(() => useLink(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.source).toBe('1');
      expect(result.current.target).toBe('2');
    });
  });

  it('should get link with selector', async () => {
    const { result } = renderHook(
      () => useLink((link) => link.source),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBe('1');
    });
  });
});
