import type { dia } from '@joint/core';
import { toLinkEndAttribute, toLinkEndData } from '../data-mapping/link-attributes';

describe('toLinkEndAttribute', () => {
  it('should wrap string id in object', () => {
    const result = toLinkEndAttribute('element-1');

    expect(result).toEqual({ id: 'element-1' });
  });

  it('should pass through object with id', () => {
    const end: dia.Link.EndJSON = { id: 'element-1' };
    const result = toLinkEndAttribute(end);

    expect(result).toBe(end);
  });

  it('should pass through object with id and port', () => {
    const end: dia.Link.EndJSON = { id: 'element-1', port: 'port-1' };
    const result = toLinkEndAttribute(end);

    expect(result).toBe(end);
  });

  it('should pass through object with id, port, and magnet', () => {
    const end: dia.Link.EndJSON = { id: 'element-1', port: 'port-1', magnet: 'magnet-1' };
    const result = toLinkEndAttribute(end);

    expect(result).toBe(end);
  });
});

describe('toLinkEndData', () => {
  it('should flatten { id } to string', () => {
    const result = toLinkEndData({ id: 'element-1' });

    expect(result).toBe('element-1');
  });

  it('should keep { id, port } as object', () => {
    const result = toLinkEndData({ id: 'element-1', port: 'port-1' });

    expect(result).toEqual({ id: 'element-1', port: 'port-1' });
  });

  it('should keep object with anchor as-is', () => {
    const end: dia.Link.EndJSON = {
      id: 'element-1',
      anchor: { name: 'center' },
    };
    const result = toLinkEndData(end);

    expect(result).toBe(end);
  });

  it('should keep object with connectionPoint as-is', () => {
    const end: dia.Link.EndJSON = {
      id: 'element-1',
      connectionPoint: { name: 'boundary' },
    };
    const result = toLinkEndData(end);

    expect(result).toBe(end);
  });

  it('should keep object with both anchor and connectionPoint as-is', () => {
    const end: dia.Link.EndJSON = {
      id: 'element-1',
      port: 'port-1',
      anchor: { name: 'center' },
      connectionPoint: { name: 'boundary' },
    };
    const result = toLinkEndData(end);

    expect(result).toBe(end);
  });
});
