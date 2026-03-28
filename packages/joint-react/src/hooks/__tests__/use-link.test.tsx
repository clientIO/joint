import { renderHook, waitFor } from '@testing-library/react';
import { paperRenderLinkWrapper } from '../../utils/test-wrappers';
import { useLink } from '../use-link';

describe('useLink', () => {
  const wrapper = paperRenderLinkWrapper({
    graphProviderProps: {
      elements: {
        '1': { data: undefined, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
        '2': { data: undefined, position: { x: 100, y: 100 }, size: { width: 10, height: 10 } },
      },
      links: {
        'link-1': { source: { id: '1' }, target: { id: '2' }, color: '#FF0000' },
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
      expect(result.current.source).toEqual({ id: '1' });
      expect(result.current.target).toEqual({ id: '2' });
    });
  });

  it('should get link with selector', async () => {
    const { result } = renderHook(
      () => useLink((link) => link.source),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toEqual({ id: '1' });
    });
  });
});
