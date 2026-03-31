import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useGraph } from '../use-graph';
import { useElements } from '../use-elements';
import { useLinks } from '../use-links';
import { act } from 'react';
import type { ReducerType } from '@reduxjs/toolkit';

describe('useGraph', () => {
  const simpleWrapper = graphProviderWrapper({
    elements: { '1': { size: { width: 100, height: 100 } } },
  });

  it('should return graph instance and mutation methods', async () => {
    const { result } = renderHook(() => useGraph(), { wrapper: simpleWrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.graph).toHaveProperty('getCells');
      expect(result.current.graph).toHaveProperty('addCell');
      expect(result.current.graph).toHaveProperty('getCell');
      expect(result.current.setElement).toBeInstanceOf(Function);
      expect(result.current.removeElement).toBeInstanceOf(Function);
      expect(result.current.setLink).toBeInstanceOf(Function);
      expect(result.current.removeLink).toBeInstanceOf(Function);
    });
  });

  it('should return the same result on re-render', async () => {
    const { result, rerender } = renderHook(() => useGraph(), { wrapper: simpleWrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const firstResult = result.current;
    rerender();

    await waitFor(() => {
      expect(result.current).toBe(firstResult);
    });
  });
});

describe('useGraph element mutations', () => {
  // @ts-expect-error - We setup in beforeEach
  let wrapper: ReducerType<React.JSX.Element, unknown>;
  beforeEach(() => {
    wrapper = graphProviderWrapper({
      elements: {
        '1': { position: { x: 50, y: 50 }, size: { width: 97, height: 99 } },
        '2': { position: { x: 200, y: 200 }, size: { width: 97, height: 99 } },
      },
      links: {
        '3': { source: { id: '1' }, target: { id: '2' } },
      },
    });
  });

  it('should set and remove elements', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), elements: useElements() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getElements().length).toBe(2);
      expect(result.current.elements.get('1')!.size.width).toBe(97);
    });

    act(() => result.current.setElement('1', { size: { width: 1000 } }));

    await waitFor(() => {
      expect(result.current.graph.getElements().length).toBe(2);
      expect(result.current.elements.get('1')!.size.width).toBe(1000);
    });

    act(() => result.current.setElement('10', { size: { width: 999 } }));

    await waitFor(() => {
      expect(result.current.graph.getElements().length).toBe(3);
      expect(result.current.elements.get('10')!.size.width).toBe(999);
    });

    act(() => result.current.setElement('2', (previous) => ({ ...previous, size: { width: 500, height: previous.size?.height ?? 99 } })));

    await waitFor(() => {
      expect(result.current.elements.get('2')!.size.width).toBe(500);
    });

    act(() => result.current.removeElement('1'));

    await waitFor(() => {
      expect(result.current.graph.getElements().length).toBe(2);
      expect(result.current.elements.get('1')).toBeUndefined();
      expect(result.current.elements.get('2')!.size.width).toBe(500);
    });
  });

  it('should set size using updater', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), elements: useElements() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.elements.get('1')!.size.width).toBe(97);
    });

    act(() => result.current.setElement('1', (previous) => ({ ...previous, size: { width: 200, height: 250 } })));

    await waitFor(() => {
      const size = result.current.graph.getCell('1')?.get('size');
      expect(size?.width).toBe(200);
      expect(size?.height).toBe(250);
      expect(result.current.elements.get('1')!.size.width).toBe(200);
      expect(result.current.elements.get('1')!.size.height).toBe(250);
    });
  });

  it('should set angle correctly', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), elements: useElements() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.elements.get('1')).toBeDefined();
    });

    act(() => result.current.setElement('1', (previous) => ({ ...previous, angle: 45 })));

    await waitFor(() => {
      expect(result.current.graph.getCell('1')?.get('angle')).toBe(45);
      expect(result.current.elements.get('1')!.angle).toBe(45);
    });
  });

  it('should update custom data fields and reflect in useElements', async () => {
    const customWrapper = graphProviderWrapper({
      elements: { '1': { data: { label: 'Initial Label' }, position: { x: 50, y: 50 }, size: { width: 100, height: 50 } } },
    });

    const { result } = renderHook(
      () => ({ ...useGraph(), elements: useElements() }),
      { wrapper: customWrapper }
    );

    await waitFor(() => {
      expect((result.current.elements.get('1')!.data as Record<string, unknown>).label).toBe('Initial Label');
    });

    act(() => result.current.setElement('1', (previous) => ({ ...previous, data: { ...previous.data, label: 'Updated Label' } })));

    await waitFor(() => {
      expect((result.current.elements.get('1')!.data as Record<string, unknown>).label).toBe('Updated Label');
      expect(result.current.elements.get('1')!.size.width).toBe(100);
    });
  });

  it('should update elements when size is changed', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), elements: useElements() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.elements.get('1')?.size.width).toBe(97);
      expect(result.current.elements.get('1')?.size.height).toBe(99);
    });

    act(() => result.current.setElement('1', (previous) => ({ ...previous, size: { width: 400, height: 450 } })));

    await waitFor(() => {
      expect(result.current.elements.get('1')?.size.width).toBe(400);
      expect(result.current.elements.get('1')?.size.height).toBe(450);
    });
  });

  it('should create a new element via updater when it does not exist', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), elements: useElements() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.elements.get('new-el')).toBeUndefined();
    });

    act(() => result.current.setElement('new-el', (previous) => ({ ...previous, data: { label: 'Created' } })));

    await waitFor(() => {
      expect(result.current.elements.get('new-el')).toBeDefined();
      expect((result.current.elements.get('new-el')!.data as Record<string, unknown>).label).toBe('Created');
      expect(result.current.elements.get('new-el')!.position.x).toBe(0);
      expect(result.current.elements.get('new-el')!.position.y).toBe(0);
      expect(result.current.elements.get('new-el')!.size.width).toBe(0);
      expect(result.current.elements.get('new-el')!.size.height).toBe(0);
    });
  });

  it('should sync element update during active batch', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), elements: useElements() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.elements.get('1')).toBeDefined();
    });

    act(() => {
      result.current.graph.startBatch('test');
      result.current.setElement('1', { position: { x: 125, y: 175 } });
    });

    expect(result.current.graph.getCell('1')?.get('position')).toEqual({ x: 125, y: 175 });

    act(() => result.current.graph.stopBatch('test'));

    await waitFor(() => {
      expect(result.current.elements.get('1')?.position.x).toBe(125);
      expect(result.current.elements.get('1')?.position.y).toBe(175);
    });
  });
});

describe('useGraph link mutations', () => {
  // @ts-expect-error - We setup in beforeEach
  let wrapper: ReducerType<React.JSX.Element, unknown>;
  beforeEach(() => {
    wrapper = graphProviderWrapper({
      elements: {
        '1': { position: { x: 50, y: 50 }, size: { width: 97, height: 99 } },
        '2': { position: { x: 200, y: 200 }, size: { width: 97, height: 99 } },
      },
      links: {
        '3': { source: { id: '1' }, target: { id: '2' } },
      },
    });
  });

  it('should set, update, and remove links', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), links: useLinks() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getLinks().length).toBe(1);
    });

    act(() => result.current.setLink('3', { source: { id: '1' }, target: { id: '2' }, style: { color: '#001DFF' } }));

    await waitFor(() => {
      const link = result.current.graph.getCell('3');
      expect(link?.get('attrs')?.line?.style?.stroke ?? '').toBe('#001DFF');
    });

    act(() => result.current.setLink('3', (previous) => ({ ...previous, style: { color: '#FF0000' } })));

    await waitFor(() => {
      const link = result.current.graph.getCell('3');
      expect(link?.get('attrs')?.line?.style?.stroke ?? '').toBe('#FF0000');
    });

    act(() => result.current.setLink('30', { source: { id: '2' }, target: { id: '1' }, style: { color: '#00FF00' } }));

    await waitFor(() => {
      expect(result.current.graph.getLinks().length).toBe(2);
      const link = result.current.graph.getCell('30');
      expect(link?.get('attrs')?.line?.style?.stroke ?? '').toBe('#00FF00');
    });

    act(() => result.current.removeLink('3'));

    await waitFor(() => {
      expect(result.current.graph.getLinks().length).toBe(1);
      expect(result.current.graph.getCell('3')).toBeUndefined();
    });

    act(() => result.current.removeLink('30'));

    await waitFor(() => {
      expect(result.current.graph.getLinks().length).toBe(0);
    });
  });

  it('should create a new link and make it visible in graph', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), links: useLinks() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.links.get('3')).toBeDefined();
    });

    act(() => result.current.setLink('new-link', { source: { id: '2' }, target: { id: '1' } }));

    await waitFor(() => {
      expect(result.current.links.size).toBe(2);
      expect(result.current.links.get('new-link')!.source).toEqual({ id: '2' });
      expect(result.current.graph.getLinks().length).toBe(2);
    });
  });

  it('should remove a pending link before it is synced', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), links: useLinks() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getLinks().length).toBe(1);
    });

    act(() => {
      result.current.setLink('pending-link', { source: { id: '2' }, target: { id: '1' }, color: '#FF9505' });
      result.current.removeLink('pending-link');
    });

    await waitFor(() => {
      expect(result.current.links.get('pending-link')).toBeUndefined();
      expect(result.current.graph.getLinks().length).toBe(1);
    });
  });

  it('should create a new link via updater when it does not exist', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), links: useLinks() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.links.get('new-link-updater')).toBeUndefined();
    });

    act(() => result.current.setLink('new-link-updater', (previous) => ({
      ...previous,
      source: { id: '1' },
      target: { id: '2' },
      color: '#123456',
    })));

    await waitFor(() => {
      expect(result.current.links.get('new-link-updater')).toBeDefined();
      expect(result.current.links.get('new-link-updater')!.source).toEqual({ id: '1' });
      expect(result.current.links.get('new-link-updater')!.target).toEqual({ id: '2' });
    });
  });

  it('should sync a new link during active batch', async () => {
    const { result } = renderHook(
      () => ({ ...useGraph(), links: useLinks() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getLinks().length).toBe(1);
    });

    act(() => {
      result.current.graph.startBatch('test');
      result.current.setLink('batched-link', { source: { id: '2' }, target: { id: '1' }, color: '#FF9505' });
    });

    expect(result.current.graph.getCell('batched-link')).toBeDefined();

    act(() => result.current.graph.stopBatch('test'));

    await waitFor(() => {
      expect(result.current.links.get('batched-link')).toBeDefined();
    });
  });
});
