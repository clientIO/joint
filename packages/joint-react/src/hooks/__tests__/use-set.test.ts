import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useSetElement, useSetLink, useRemoveElement, useRemoveLink } from '../use-cell-setters';
import { useGraph } from '../use-graph';
import { useElements } from '../use-elements';
import { useLinks } from '../use-links';
import { act } from 'react';
import type { ReducerType } from '@reduxjs/toolkit';

describe('useSetElement / useRemoveElement', () => {
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
      () => ({
        graph: useGraph().graph,
        setElement: useSetElement(),
        removeElement: useRemoveElement(),
        elements: useElements(),
      }),
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

    act(() =>
      result.current.setElement('2', (previous) => ({
        ...previous,
        size: { width: 500, height: previous.size?.height ?? 99 },
      }))
    );

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
      () => ({
        setElement: useSetElement(),
        elements: useElements(),
        graph: useGraph().graph,
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.elements.get('1')!.size.width).toBe(97);
    });

    act(() =>
      result.current.setElement('1', (previous) => ({
        ...previous,
        size: { width: 200, height: 250 },
      }))
    );

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
      () => ({
        setElement: useSetElement(),
        elements: useElements(),
        graph: useGraph().graph,
      }),
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
      elements: {
        '1': {
          data: { label: 'Initial Label' },
          position: { x: 50, y: 50 },
          size: { width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(
      () => ({
        setElement: useSetElement(),
        elements: useElements(),
      }),
      { wrapper: customWrapper }
    );

    await waitFor(() => {
      expect((result.current.elements.get('1')!.data as Record<string, unknown>).label).toBe(
        'Initial Label'
      );
    });

    act(() =>
      result.current.setElement('1', (previous) => ({
        ...previous,
        data: { ...previous.data, label: 'Updated Label' },
      }))
    );

    await waitFor(() => {
      expect((result.current.elements.get('1')!.data as Record<string, unknown>).label).toBe(
        'Updated Label'
      );
      expect(result.current.elements.get('1')!.size.width).toBe(100);
    });
  });

  it('should update elements when size is changed', async () => {
    const { result } = renderHook(
      () => ({
        setElement: useSetElement(),
        elements: useElements(),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.elements.get('1')?.size.width).toBe(97);
      expect(result.current.elements.get('1')?.size.height).toBe(99);
    });

    act(() =>
      result.current.setElement('1', (previous) => ({
        ...previous,
        size: { width: 400, height: 450 },
      }))
    );

    await waitFor(() => {
      expect(result.current.elements.get('1')?.size.width).toBe(400);
      expect(result.current.elements.get('1')?.size.height).toBe(450);
    });
  });

  it('should create a new element via updater when it does not exist', async () => {
    const { result } = renderHook(
      () => ({
        setElement: useSetElement(),
        elements: useElements(),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.elements.get('new-el')).toBeUndefined();
    });

    act(() =>
      result.current.setElement('new-el', (previous) => ({
        ...previous,
        data: { label: 'Created' },
      }))
    );

    await waitFor(() => {
      expect(result.current.elements.get('new-el')).toBeDefined();
      expect((result.current.elements.get('new-el')!.data as Record<string, unknown>).label).toBe(
        'Created'
      );
      expect(result.current.elements.get('new-el')!.position.x).toBe(0);
      expect(result.current.elements.get('new-el')!.position.y).toBe(0);
      expect(result.current.elements.get('new-el')!.size.width).toBe(0);
      expect(result.current.elements.get('new-el')!.size.height).toBe(0);
    });
  });

  it('should sync element update during active batch', async () => {
    const { result } = renderHook(
      () => ({
        graph: useGraph().graph,
        setElement: useSetElement(),
        elements: useElements(),
      }),
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

describe('useSetLink / useRemoveLink', () => {
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
      () => ({
        graph: useGraph().graph,
        setLink: useSetLink(),
        removeLink: useRemoveLink(),
        links: useLinks(),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getLinks().length).toBe(1);
    });

    act(() =>
      result.current.setLink('3', {
        source: { id: '1' },
        target: { id: '2' },
        style: { color: '#001DFF' },
      })
    );

    await waitFor(() => {
      const link = result.current.graph.getCell('3');
      expect(link?.get('attrs')?.line?.style?.stroke ?? '').toBe('#001DFF');
    });

    act(() =>
      result.current.setLink('3', (previous) => ({
        ...previous,
        style: { color: '#FF0000' },
      }))
    );

    await waitFor(() => {
      const link = result.current.graph.getCell('3');
      expect(link?.get('attrs')?.line?.style?.stroke ?? '').toBe('#FF0000');
    });

    act(() =>
      result.current.setLink('30', {
        source: { id: '2' },
        target: { id: '1' },
        style: { color: '#00FF00' },
      })
    );

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
      () => ({
        graph: useGraph().graph,
        setLink: useSetLink(),
        links: useLinks(),
      }),
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
      () => ({
        graph: useGraph().graph,
        setLink: useSetLink(),
        removeLink: useRemoveLink(),
        links: useLinks(),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getLinks().length).toBe(1);
    });

    act(() => {
      result.current.setLink('pending-link', {
        source: { id: '2' },
        target: { id: '1' },
        color: '#FF9505',
      });
      result.current.removeLink('pending-link');
    });

    await waitFor(() => {
      expect(result.current.links.get('pending-link')).toBeUndefined();
      expect(result.current.graph.getLinks().length).toBe(1);
    });
  });

  it('should create a new link via updater when it does not exist', async () => {
    const { result } = renderHook(
      () => ({
        setLink: useSetLink(),
        links: useLinks(),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.links.get('new-link-updater')).toBeUndefined();
    });

    act(() =>
      result.current.setLink('new-link-updater', (previous) => ({
        ...previous,
        source: { id: '1' },
        target: { id: '2' },
        color: '#123456',
      }))
    );

    await waitFor(() => {
      expect(result.current.links.get('new-link-updater')).toBeDefined();
      expect(result.current.links.get('new-link-updater')!.source).toEqual({ id: '1' });
      expect(result.current.links.get('new-link-updater')!.target).toEqual({ id: '2' });
    });
  });

  it('should sync a new link during active batch', async () => {
    const { result } = renderHook(
      () => ({
        graph: useGraph().graph,
        setLink: useSetLink(),
        links: useLinks(),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getLinks().length).toBe(1);
    });

    act(() => {
      result.current.graph.startBatch('test');
      result.current.setLink('batched-link', {
        source: { id: '2' },
        target: { id: '1' },
        color: '#FF9505',
      });
    });

    expect(result.current.graph.getCell('batched-link')).toBeDefined();

    act(() => result.current.graph.stopBatch('test'));

    await waitFor(() => {
      expect(result.current.links.get('batched-link')).toBeDefined();
    });
  });
});

type CellWithPort = {
  getPort?: (id: string) => { attrs?: { portBody?: { style?: { fill?: string } } } } | null;
};

function getPortColor(cell: unknown, portId: string): string | undefined {
  const element = cell as CellWithPort;
  const port = element.getPort?.(portId);
  return port?.attrs?.portBody?.style?.fill;
}

describe('useGraph().setElements / useGraph().setLinks (batch setters)', () => {
  const wrapper = graphProviderWrapper({
    elements: {
      a: {
        position: { x: 0, y: 0 },
        size: { width: 100, height: 40 },
        portMap: { out: { cx: 'calc(w)', cy: 'calc(0.5*h)' } },
      },
      b: {
        position: { x: 200, y: 0 },
        size: { width: 100, height: 40 },
        portMap: { in: { cx: 0, cy: 'calc(0.5*h)' } },
      },
    },
    links: {
      'a-b': { source: { id: 'a', port: 'out' }, target: { id: 'b', port: 'in' } },
    },
  });

  it('setElements should apply portStyle via updater so port fill color updates', async () => {
    const { result } = renderHook(
      () => ({
        graph: useGraph().graph,
        setElements: useGraph().setElements,
        elements: useElements(),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.elements.get('a')).toBeDefined();
      expect(result.current.elements.get('b')).toBeDefined();
    });

    act(() =>
      result.current.setElements((previous) => {
        const next: Record<string, (typeof previous)[string]> = {};
        for (const [id, element] of Object.entries(previous)) {
          next[id] = { ...element, portStyle: { color: '#FF0000', shape: 'ellipse' } };
        }
        return next;
      })
    );

    await waitFor(() => {
      const cellA = result.current.graph.getCell('a');
      const cellB = result.current.graph.getCell('b');
      expect(getPortColor(cellA, 'out')).toBe('#FF0000');
      expect(getPortColor(cellB, 'in')).toBe('#FF0000');
    });

    act(() =>
      result.current.setElements((previous) => {
        const next: Record<string, (typeof previous)[string]> = {};
        for (const [id, element] of Object.entries(previous)) {
          next[id] = { ...element, portStyle: { color: '#FFBB00', shape: 'rect' } };
        }
        return next;
      })
    );

    await waitFor(() => {
      const cellA = result.current.graph.getCell('a');
      const cellB = result.current.graph.getCell('b');
      expect(getPortColor(cellA, 'out')).toBe('#FFBB00');
      expect(getPortColor(cellB, 'in')).toBe('#FFBB00');
    });
  });

  it('setElements + setLinks back-to-back should not revert port style', async () => {
    const { result } = renderHook(
      () => ({
        graph: useGraph().graph,
        setElements: useGraph().setElements,
        setLinks: useGraph().setLinks,
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getCell('a')).toBeDefined();
      expect(result.current.graph.getCell('a-b')).toBeDefined();
    });

    act(() => {
      result.current.setElements((previous) => {
        const next: Record<string, (typeof previous)[string]> = {};
        for (const [id, element] of Object.entries(previous)) {
          next[id] = { ...element, portStyle: { color: '#FF0000', shape: 'ellipse' } };
        }
        return next;
      });
      result.current.setLinks((previous) => {
        const next: Record<string, (typeof previous)[string]> = {};
        for (const [id, link] of Object.entries(previous)) {
          next[id] = { ...link, style: { color: '#FF0000' } };
        }
        return next;
      });
    });

    await waitFor(() => {
      const cellA = result.current.graph.getCell('a');
      const cellB = result.current.graph.getCell('b');
      const linkAB = result.current.graph.getCell('a-b');
      expect(getPortColor(cellA, 'out')).toBe('#FF0000');
      expect(getPortColor(cellB, 'in')).toBe('#FF0000');
      expect(linkAB?.get('attrs')?.line?.style?.stroke ?? '').toBe('#FF0000');
    });
  });

  it('setElements should remove elements that are absent from the next record', async () => {
    const { result } = renderHook(
      () => ({
        graph: useGraph().graph,
        setElements: useGraph().setElements,
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getCell('a')).toBeDefined();
      expect(result.current.graph.getCell('b')).toBeDefined();
    });

    act(() => result.current.setElements((previous) => ({ a: previous.a })));

    await waitFor(() => {
      expect(result.current.graph.getCell('a')).toBeDefined();
      expect(result.current.graph.getCell('b')).toBeUndefined();
    });
  });

  it('setLinks should remove links that are absent from the next record', async () => {
    const { result } = renderHook(
      () => ({
        graph: useGraph().graph,
        setLinks: useGraph().setLinks,
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.graph.getCell('a-b')).toBeDefined();
    });

    act(() => result.current.setLinks(() => ({})));

    await waitFor(() => {
      expect(result.current.graph.getCell('a-b')).toBeUndefined();
      expect(result.current.graph.getCell('a')).toBeDefined();
      expect(result.current.graph.getCell('b')).toBeDefined();
    });
  });

  it('setLinks should apply style via updater so link stroke color updates', async () => {
    const { result } = renderHook(
      () => ({
        graph: useGraph().graph,
        setLinks: useGraph().setLinks,
        links: useLinks(),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.links.get('a-b')).toBeDefined();
    });

    act(() =>
      result.current.setLinks((previous) => {
        const next: Record<string, (typeof previous)[string]> = {};
        for (const [id, link] of Object.entries(previous)) {
          next[id] = { ...link, style: { color: '#FF0000' } };
        }
        return next;
      })
    );

    await waitFor(() => {
      const link = result.current.graph.getCell('a-b');
      expect(link?.get('attrs')?.line?.style?.stroke ?? '').toBe('#FF0000');
    });

    act(() =>
      result.current.setLinks((previous) => {
        const next: Record<string, (typeof previous)[string]> = {};
        for (const [id, link] of Object.entries(previous)) {
          next[id] = { ...link, style: { color: '#FFBB00' } };
        }
        return next;
      })
    );

    await waitFor(() => {
      const link = result.current.graph.getCell('a-b');
      expect(link?.get('attrs')?.line?.style?.stroke ?? '').toBe('#FFBB00');
    });
  });
});
