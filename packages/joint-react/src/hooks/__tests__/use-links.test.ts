import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useLinks } from '../use-links';
import type { GraphLink } from '../../types/link-types';
import type { dia } from '@joint/core';

// Extract link source ID - source can be ID (string/number) or EndJSON object
function getLinkSourceId(link: GraphLink) {
  if (typeof link.source === 'object' && link.source != null && 'id' in link.source) {
    return link.source.id;
  }
  return link.source as dia.Cell.ID;
}

describe('use-links', () => {
  const wrapper = graphProviderWrapper({
    elements: {
      '1': {
        id: '1',
        width: 97,
        height: 99,
      },
      '2': {
        id: '2',
        width: 97,
        height: 99,
      },
    },
    links: {
      '3': {
        id: '3',
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
      expect(renders).toHaveBeenCalledTimes(1);
      expect(Object.keys(result.current).length).toBe(1);
      expect(result.current['3'].id).toBe('3');
    });
  });

  it('should get links properly with selector', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useLinks((links) => Object.values(links).map(getLinkSourceId));
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      expect(result.current.length).toBe(1);
      expect(result.current[0]).toBe('1');
    });
  });
});
