import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { GraphStoreContext } from '../../context';
import { useLinksData } from '../use-links-data';

interface TestLinkData {
  readonly data: { readonly label: string };
}

function createTestContext() {
  const elements = createContainer<never>();
  const links = createContainer<TestLinkData>();
  const elementsLayout = createContainer<never>();
  const linksLayout = createContainer<never>();

  const graphStore = {
    graphView: {
      elements: asReadonlyContainer(elements),
      links: asReadonlyContainer(links),
      elementsLayout: asReadonlyContainer(elementsLayout),
      linksLayout: asReadonlyContainer(linksLayout),
      destroy: () => {},
    },
  } as never;

  function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
      <GraphStoreContext.Provider value={graphStore}>
        {children}
      </GraphStoreContext.Provider>
    );
  }

  return { links, Wrapper };
}

describe('useLinksData', () => {
  it('returns empty Map when no links exist', () => {
    const { Wrapper } = createTestContext();

    const { result } = renderHook(() => useLinksData(), {
      wrapper: Wrapper,
    });

    expect(result.current).toBeInstanceOf(Map);
    expect(result.current.size).toBe(0);
  });

  it('returns Map of full items for all links', async () => {
    const { links, Wrapper } = createTestContext();
    links.set('l-1', { data: { label: 'Link A' } });
    links.set('l-2', { data: { label: 'Link B' } });
    links.commitChanges();

    const { result } = renderHook(() => useLinksData(), {
      wrapper: Wrapper,
    });

    await act(async () => {});

    expect(result.current.size).toBe(2);
    expect(result.current.get('l-1')).toEqual({ data: { label: 'Link A' } });
    expect(result.current.get('l-2')).toEqual({ data: { label: 'Link B' } });
  });

  it('returns only requested links when IDs are provided', async () => {
    const { links, Wrapper } = createTestContext();
    links.set('l-1', { data: { label: 'Link A' } });
    links.set('l-2', { data: { label: 'Link B' } });
    links.set('l-3', { data: { label: 'Link C' } });
    links.commitChanges();

    const { result } = renderHook(() => useLinksData('l-1', 'l-3'), {
      wrapper: Wrapper,
    });

    await act(async () => {});

    expect(result.current.size).toBe(2);
    expect(result.current.get('l-1')).toEqual({ data: { label: 'Link A' } });
    expect(result.current.get('l-3')).toEqual({ data: { label: 'Link C' } });
    expect(result.current.has('l-2')).toBe(false);
  });

  it('returns selector result when selector is provided', async () => {
    const { links, Wrapper } = createTestContext();
    links.set('l-1', { data: { label: 'Link A' } });
    links.set('l-2', { data: { label: 'Link B' } });
    links.commitChanges();

    const { result } = renderHook(
      () => useLinksData((items) => items.size),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current).toBe(2);
  });

  it('updates Map when link data changes', async () => {
    const { links, Wrapper } = createTestContext();
    links.set('l-1', { data: { label: 'initial' } });
    links.commitChanges();

    const { result } = renderHook(() => useLinksData(), {
      wrapper: Wrapper,
    });

    await act(async () => {});
    expect(result.current.get('l-1')).toEqual({ data: { label: 'initial' } });

    await act(async () => {
      links.set('l-1', { data: { label: 'updated' } });
      links.commitChanges();
    });

    expect(result.current.get('l-1')).toEqual({ data: { label: 'updated' } });
  });
});
