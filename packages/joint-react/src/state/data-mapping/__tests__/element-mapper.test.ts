import type { dia } from '@joint/core';
import {
  mapAttributesToElement,
  mapElementToAttributes,
} from '../element-mapper';
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';
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
    // default type stripped
    expect(result).not.toHaveProperty('type');
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
