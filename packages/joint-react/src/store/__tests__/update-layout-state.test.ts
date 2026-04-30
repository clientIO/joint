import { dia } from '@joint/core';
import { getElementLayoutFields, getLinkLayout } from '../update-layout-state';

/**
 * dia.Element's `set` typing is narrowed to the declared attribute keys at
 * construction time, so loosening to a shared overload type lets the tests
 * write arbitrary attribute slots (e.g. `position`) without `any`.
 */
type LooseElement = dia.Element & {
  set: (name: string, value: unknown) => unknown;
};

describe('getElementLayoutFields', () => {
  it('returns null when the element has no size attribute', () => {
    const element = new dia.Element() as LooseElement;
    // dia.Element has a default size; force it to undefined to exercise the early return
    element.set('size', undefined);
    expect(getElementLayoutFields(element)).toBeNull();
  });

  it('returns position, size and angle from a fully-populated element', () => {
    const element = new dia.Element({
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
      angle: 45,
    });
    expect(getElementLayoutFields(element)).toEqual({
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
      angle: 45,
    });
  });

  it('falls back to default point when position is missing', () => {
    const element = new dia.Element({
      size: { width: 100, height: 50 },
    }) as LooseElement;
    element.set('position', undefined);
    const result = getElementLayoutFields(element);
    expect(result?.position).toEqual({ x: 0, y: 0 });
  });

  it('falls back to angle 0 when angle is missing', () => {
    const element = new dia.Element({
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
    });
    expect(getElementLayoutFields(element)?.angle).toBe(0);
  });

  it('treats partial position values as zero', () => {
    const element = new dia.Element({
      size: { width: 100, height: 50 },
    }) as LooseElement;
    element.set('position', { x: undefined, y: undefined });
    expect(getElementLayoutFields(element)?.position).toEqual({ x: 0, y: 0 });
  });

  it('treats partial size values as zero', () => {
    const element = new dia.Element() as LooseElement;
    element.set('size', { width: undefined, height: undefined });
    expect(getElementLayoutFields(element)?.size).toEqual({ width: 0, height: 0 });
  });
});

describe('getLinkLayout', () => {
  it('returns coordinates and serialized path from a link view', () => {
    const linkView = {
      sourcePoint: { x: 10, y: 20 },
      targetPoint: { x: 100, y: 200 },
      getSerializedConnection: () => 'M 10 20 L 100 200',
    } as unknown as dia.LinkView;

    expect(getLinkLayout(linkView)).toEqual({
      sourceX: 10,
      sourceY: 20,
      targetX: 100,
      targetY: 200,
      d: 'M 10 20 L 100 200',
    });
  });

  it('falls back to default points when missing', () => {
    const linkView = {
      sourcePoint: undefined,
      targetPoint: undefined,
      getSerializedConnection: () => '',
    } as unknown as dia.LinkView;

    expect(getLinkLayout(linkView)).toEqual({
      sourceX: 0,
      sourceY: 0,
      targetX: 0,
      targetY: 0,
      d: '',
    });
  });

  it('falls back to empty path when getSerializedConnection is absent', () => {
    const linkView = {
      sourcePoint: { x: 1, y: 2 },
      targetPoint: { x: 3, y: 4 },
    } as unknown as dia.LinkView;

    expect(getLinkLayout(linkView).d).toBe('');
  });
});
