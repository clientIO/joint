import type { dia } from '@joint/core';
import {
  mapAttributesToElement,
  mapElementToAttributes,
} from '../element-mapper';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import type { ElementJSONInit } from '../../../types/cell.types';

describe('mapElementToAttributes', () => {
  it('preserves a custom type when provided', () => {
    const result = mapElementToAttributes({
      type: 'custom.Element',
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
    } as unknown as ElementJSONInit);
    expect(result.type).toBe('custom.Element');
  });

  it('omits size when the user record has no size', () => {
    const result = mapElementToAttributes({
      id: 'a',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 60, y: 60 },
      data: { label: 'A' },
    } as ElementJSONInit);
    expect(result).not.toHaveProperty('size');
  });

  it('omits position when the user record has no position', () => {
    const result = mapElementToAttributes({
      id: 'a',
      type: ELEMENT_MODEL_TYPE,
      data: { label: 'A' },
    } as ElementJSONInit);
    expect(result).not.toHaveProperty('position');
  });

  it('fills missing height with 0 when only width is supplied', () => {
    const result = mapElementToAttributes({
      id: 'a',
      type: ELEMENT_MODEL_TYPE,
      size: { width: 80 },
    } as unknown as ElementJSONInit);
    expect(result.size).toEqual({ width: 80, height: 0 });
  });

  it('defaults angle to 0 and data to {} when omitted', () => {
    const result = mapElementToAttributes({
      id: 'a',
      type: ELEMENT_MODEL_TYPE,
      position: { x: 5, y: 5 },
    } as ElementJSONInit);
    expect(result.angle).toBe(0);
    expect(result.data).toEqual({});
  });
});

describe('mapAttributesToElement', () => {
  it('returns ports as-is when no portMap is present', () => {
    const ports = { items: [{ id: 'p1' }] };
    const result = mapAttributesToElement<ElementJSONInit>({
      type: ELEMENT_MODEL_TYPE,
      ports,
    } as dia.Element.Attributes);

    expect(result.ports).toEqual(ports);
    expect(result).not.toHaveProperty('portMap');
    expect(result.type).toBe(ELEMENT_MODEL_TYPE);
  });

  it('returns portMap when present and ignores native ports', () => {
    const portMap = { p1: { id: 'p1' } };
    const result = mapAttributesToElement<ElementJSONInit>({
      type: ELEMENT_MODEL_TYPE,
      portMap,
      ports: { items: [{ id: 'p1' }] },
    } as dia.Element.Attributes);

    expect(result.portMap).toEqual(portMap);
    expect(result).not.toHaveProperty('ports');
  });

  it('preserves a custom type', () => {
    const result = mapAttributesToElement<ElementJSONInit>({
      type: 'custom.Element',
    } as dia.Element.Attributes);
    expect(result.type).toBe('custom.Element');
  });
});
