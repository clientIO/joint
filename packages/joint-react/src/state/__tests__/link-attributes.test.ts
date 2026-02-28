import type { dia } from '@joint/core';
import { normalizeLinkEnd } from '../data-mapping/link-attributes';

describe('normalizeLinkEnd', () => {
  it('should return object when id is already an object', () => {
    const id: dia.Link.EndJSON = {
      id: 'element-1',
      port: 'port-1',
      magnet: 'magnet-1',
    };

    const result = normalizeLinkEnd(id);

    expect(result).toBe(id);
    expect(result).toEqual({
      id: 'element-1',
      port: 'port-1',
      magnet: 'magnet-1',
    });
  });

  it('should wrap string id in object', () => {
    const id = 'element-1';
    const result = normalizeLinkEnd(id);

    expect(result).toEqual({
      id: 'element-1',
    });
  });

  it('should handle object with only id', () => {
    const id: dia.Link.EndJSON = {
      id: 'element-1',
    };

    const result = normalizeLinkEnd(id);

    expect(result).toBe(id);
    expect(result).toEqual({
      id: 'element-1',
    });
  });

  it('should handle object with id and port', () => {
    const id: dia.Link.EndJSON = {
      id: 'element-1',
      port: 'port-1',
    };

    const result = normalizeLinkEnd(id);

    expect(result).toBe(id);
    expect(result).toEqual({
      id: 'element-1',
      port: 'port-1',
    });
  });
});
