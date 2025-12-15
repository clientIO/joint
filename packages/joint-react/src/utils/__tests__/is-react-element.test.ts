import { ReactElement } from '../../models/react-element';
import { isReactElement } from '../is-react-element';
import { dia } from '@joint/core';

describe('is-react-element', () => {
  it('should return true for ReactElement instance', () => {
    const element = new ReactElement({
      id: '1',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
    });

    expect(isReactElement(element)).toBe(true);
  });

  it('should return false for standard dia.Element', () => {
    const element = new dia.Element({
      id: '1',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 50 },
    });

    expect(isReactElement(element)).toBe(false);
  });

  it('should return false for dia.Link', () => {
    const link = new dia.Link({
      id: '1',
      source: { id: 'a' },
      target: { id: 'b' },
    });

    expect(isReactElement(link)).toBe(false);
  });

  it('should return false for non-cell values', () => {
    expect(isReactElement(null)).toBe(false);
    expect(isReactElement(undefined as never)).toBe(false);
    expect(isReactElement('string')).toBe(false);
    expect(isReactElement(123)).toBe(false);
    expect(isReactElement({})).toBe(false);
    expect(isReactElement([])).toBe(false);
  });
});










