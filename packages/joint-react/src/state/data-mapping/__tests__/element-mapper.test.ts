import type { dia } from '@joint/core';
import {
  mapAttributesToElement,
  mapElementToAttributes,
} from '../element-mapper';
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';
import type { DiaElementRecord } from '../../../types/cell.types';

describe('mapElementToAttributes', () => {
  it('defaults the type to ELEMENT_MODEL_TYPE when missing', () => {
    const result = mapElementToAttributes({
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
    } as DiaElementRecord);
    expect(result.type).toBe(ELEMENT_MODEL_TYPE);
  });

  it('preserves a custom type when provided', () => {
    const result = mapElementToAttributes({
      type: 'custom.Element',
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
    } as unknown as DiaElementRecord);
    expect(result.type).toBe('custom.Element');
  });
});

describe('mapAttributesToElement', () => {
  it('returns ports as-is when no portMap is present', () => {
    const ports = { items: [{ id: 'p1' }] };
    const result = mapAttributesToElement<DiaElementRecord>({
      type: ELEMENT_MODEL_TYPE,
      ports,
    } as unknown as dia.Element.Attributes);

    expect(result.ports).toEqual(ports);
    expect(result).not.toHaveProperty('portMap');
    // default type stripped
    expect(result).not.toHaveProperty('type');
  });

  it('returns portMap when present and ignores native ports', () => {
    const portMap = { p1: { id: 'p1' } };
    const result = mapAttributesToElement<DiaElementRecord>({
      type: ELEMENT_MODEL_TYPE,
      portMap,
      ports: { items: [{ id: 'p1' }] },
    } as unknown as dia.Element.Attributes);

    expect(result.portMap).toEqual(portMap);
    expect(result).not.toHaveProperty('ports');
  });

  it('preserves a custom type', () => {
    const result = mapAttributesToElement<DiaElementRecord>({
      type: 'custom.Element',
    } as unknown as dia.Element.Attributes);
    expect(result.type).toBe('custom.Element');
  });
});
