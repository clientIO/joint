import type { dia } from '@joint/core';
import { toLinkEndAttribute, toLinkEndData } from '../data-mapping/link-attributes';

describe('toLinkEndAttribute', () => {
  it('should wrap string id in object', () => {
    const result = toLinkEndAttribute('element-1');

    expect(result).toEqual({ id: 'element-1' });
  });

  it('should pass through { x, y } point', () => {
    const end = { x: 100, y: 200 } as const;
    const result = toLinkEndAttribute(end);

    expect(result).toBe(end);
  });

  it('should merge port', () => {
    const result = toLinkEndAttribute('element-1', { port: 'p1' });

    expect(result).toEqual({ id: 'element-1', port: 'p1' });
  });

  it('should merge anchor', () => {
    const result = toLinkEndAttribute('element-1', { anchor: { name: 'center' } });

    expect(result).toEqual({ id: 'element-1', anchor: { name: 'center' } });
  });

  it('should merge connectionPoint', () => {
    const result = toLinkEndAttribute('element-1', { connectionPoint: { name: 'boundary' } });

    expect(result).toEqual({ id: 'element-1', connectionPoint: { name: 'boundary' } });
  });

  it('should merge magnet', () => {
    const result = toLinkEndAttribute('element-1', { magnet: 'body' });

    expect(result).toEqual({ id: 'element-1', magnet: 'body' });
  });

  it('should merge all options', () => {
    const result = toLinkEndAttribute('element-1', {
      port: 'p1',
      anchor: { name: 'center' },
      connectionPoint: { name: 'boundary' },
      magnet: 'body',
    });

    expect(result).toEqual({
      id: 'element-1',
      port: 'p1',
      anchor: { name: 'center' },
      connectionPoint: { name: 'boundary' },
      magnet: 'body',
    });
  });

  it('should return base when options are all undefined', () => {
    const result = toLinkEndAttribute('element-1', {});

    expect(result).toEqual({ id: 'element-1' });
  });
});

describe('toLinkEndData', () => {
  it('should flatten { id } to string', () => {
    const { end } = toLinkEndData({ id: 'element-1' });

    expect(end).toBe('element-1');
  });

  it('should extract { x, y } as point', () => {
    const { end } = toLinkEndData({ x: 100, y: 200 } as dia.Link.EndJSON);

    expect(end).toEqual({ x: 100, y: 200 });
  });

  it('should extract port separately', () => {
    const { end, port } = toLinkEndData({ id: 'element-1', port: 'p1' });

    expect(end).toBe('element-1');
    expect(port).toBe('p1');
  });

  it('should extract anchor separately', () => {
    const { end, anchor } = toLinkEndData({
      id: 'element-1',
      anchor: { name: 'center' },
    });

    expect(end).toBe('element-1');
    expect(anchor).toEqual({ name: 'center' });
  });

  it('should extract connectionPoint separately', () => {
    const { end, connectionPoint } = toLinkEndData({
      id: 'element-1',
      connectionPoint: { name: 'boundary' },
    });

    expect(end).toBe('element-1');
    expect(connectionPoint).toEqual({ name: 'boundary' });
  });

  it('should extract magnet separately', () => {
    const { end, magnet } = toLinkEndData({
      id: 'element-1',
      magnet: 'body',
    });

    expect(end).toBe('element-1');
    expect(magnet).toBe('body');
  });

  it('should extract all properties from a full endpoint', () => {
    const { end, port, anchor, connectionPoint, magnet } = toLinkEndData({
      id: 'element-1',
      port: 'p1',
      anchor: { name: 'center' },
      connectionPoint: { name: 'boundary' },
      magnet: 'body',
    });

    expect(end).toBe('element-1');
    expect(port).toBe('p1');
    expect(anchor).toEqual({ name: 'center' });
    expect(connectionPoint).toEqual({ name: 'boundary' });
    expect(magnet).toBe('body');
  });

  it('should not include undefined properties in result', () => {
    const result = toLinkEndData({ id: 'element-1' });

    expect(result).toEqual({ end: 'element-1' });
    expect(result).not.toHaveProperty('port');
    expect(result).not.toHaveProperty('anchor');
    expect(result).not.toHaveProperty('connectionPoint');
    expect(result).not.toHaveProperty('magnet');
  });
});
