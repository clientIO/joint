import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useLinks } from '../use-links';
import type { LinkRecord } from '../../types/data-types';
import type { CellId } from '../../types/cell-id';

// Extract link source ID - source can be ID (string/number) or EndJSON object
function getLinkSourceId(link: LinkRecord) {
  const {source} = link;
  if (typeof source === 'object' && source != null && 'id' in source) {
    return (source as { id: CellId }).id;
  }
  return source as CellId;
}

describe('use-links', () => {
  const wrapper = graphProviderWrapper({
    elements: {
      '1': {
        data: undefined,
        size: { width: 97, height: 99 },
      },
      '2': {
        data: undefined,
        size: { width: 97, height: 99 },
      },
    },
    links: {
      '3': {
        source: '1',
        target: '2',
      },
    },
  });

  it('should get links properly without selector', async () => {
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
      expect(renders).toHaveBeenCalled();
      expect(result.current.size).toBe(1);
      expect(result.current.get('3')).toBeDefined();
      expect(result.current.get('3')?.source).toBe('1');
    });
  });

  it('should get links properly with selector', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useLinks((links) => [...links.values()].map(getLinkSourceId));
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalled();
      expect(result.current.length).toBe(1);
      expect(result.current[0]).toBe('1');
    });
  });
});
