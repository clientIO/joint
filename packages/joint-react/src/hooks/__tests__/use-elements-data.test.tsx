import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { GraphStoreContext } from '../../context';
import { useElementsData } from '../use-elements-data';

interface TestElementData {
  readonly data: { readonly label: string };
  readonly x: number;
}

function createTestContext() {
  const elements = createContainer<TestElementData>();
  const links = createContainer<never>();
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

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <GraphStoreContext.Provider value={graphStore}>
        {children}
      </GraphStoreContext.Provider>
    );
  }

  return { elements, Wrapper };
}

describe('useElementsData', () => {
  it('returns empty Map when no elements exist', () => {
    const { Wrapper } = createTestContext();

    const { result } = renderHook(() => useElementsData(), {
      wrapper: Wrapper,
    });

    expect(result.current).toBeInstanceOf(Map);
    expect(result.current.size).toBe(0);
  });

  it('returns Map of data fields for all elements', async () => {
    const { elements, Wrapper } = createTestContext();
    elements.set('el-1', { data: { label: 'A' }, x: 0 });
    elements.set('el-2', { data: { label: 'B' }, x: 50 });
    elements.commitChanges();

    const { result } = renderHook(() => useElementsData(), {
      wrapper: Wrapper,
    });

    await act(async () => {});

    expect(result.current.size).toBe(2);
    expect(result.current.get('el-1')).toEqual({ label: 'A' });
    expect(result.current.get('el-2')).toEqual({ label: 'B' });
  });

  it('returns only requested elements when IDs are provided', async () => {
    const { elements, Wrapper } = createTestContext();
    elements.set('el-1', { data: { label: 'A' }, x: 0 });
    elements.set('el-2', { data: { label: 'B' }, x: 50 });
    elements.set('el-3', { data: { label: 'C' }, x: 100 });
    elements.commitChanges();

    const { result } = renderHook(() => useElementsData('el-1', 'el-3'), {
      wrapper: Wrapper,
    });

    await act(async () => {});

    expect(result.current.size).toBe(2);
    expect(result.current.get('el-1')).toEqual({ label: 'A' });
    expect(result.current.get('el-3')).toEqual({ label: 'C' });
    expect(result.current.has('el-2')).toBe(false);
  });

  it('updates Map when element data changes', async () => {
    const { elements, Wrapper } = createTestContext();
    elements.set('el-1', { data: { label: 'initial' }, x: 0 });
    elements.commitChanges();

    const { result } = renderHook(() => useElementsData(), {
      wrapper: Wrapper,
    });

    await act(async () => {});
    expect(result.current.get('el-1')).toEqual({ label: 'initial' });

    await act(async () => {
      elements.set('el-1', { data: { label: 'updated' }, x: 0 });
      elements.commitChanges();
    });

    expect(result.current.get('el-1')).toEqual({ label: 'updated' });
  });

  it('updates Map when elements are added or removed', async () => {
    const { elements, Wrapper } = createTestContext();
    elements.set('el-1', { data: { label: 'A' }, x: 0 });
    elements.commitChanges();

    const { result } = renderHook(() => useElementsData(), {
      wrapper: Wrapper,
    });

    await act(async () => {});
    expect(result.current.size).toBe(1);

    await act(async () => {
      elements.set('el-2', { data: { label: 'B' }, x: 50 });
      elements.commitChanges();
    });

    expect(result.current.size).toBe(2);
    expect(result.current.get('el-2')).toEqual({ label: 'B' });

    await act(async () => {
      elements.delete('el-1');
      elements.commitChanges();
    });

    expect(result.current.size).toBe(1);
    expect(result.current.has('el-1')).toBe(false);
    expect(result.current.get('el-2')).toEqual({ label: 'B' });
  });
});
