import { ReactElement, REACT_TYPE } from '../react-element';
import { dia } from '@joint/core';

function createElement<Attributes = dia.Element.Attributes>(
  options?: Attributes & dia.Element.Attributes
) {
  return new ReactElement(options);
}

describe('react-element', () => {
  describe('ReactElement', () => {
    it('should create a ReactElement instance', () => {
      const element = new ReactElement({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(ReactElement);
      expect(element).toBeInstanceOf(dia.Element);
      expect(element.get('type')).toBe(REACT_TYPE);
    });

    it('should have default attributes', () => {
      const element = new ReactElement({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      const defaults = element.defaults();
      expect(defaults.type).toBe(REACT_TYPE);
    });

    it('should accept custom attributes', () => {
      const element = new ReactElement({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        data: { custom: 'value' },
      });

      expect(element.get('data')).toEqual({ custom: 'value' });
    });

    it('should work with generic attributes', () => {
      interface CustomAttributes {
        customProp?: string;
      }

      const element = new ReactElement<CustomAttributes>({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(ReactElement);
    });

    describe('markup', () => {
      it('should have empty markup array', () => {
        const element = new ReactElement();
        expect(element.markup).toEqual([]);
      });
    });
  });

  describe('createElement', () => {
    it('should create a ReactElement instance', () => {
      const element = createElement({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(ReactElement);
      expect(element.get('type')).toBe(REACT_TYPE);
    });

    it('should create element without options', () => {
      const element = createElement();

      expect(element).toBeInstanceOf(ReactElement);
      expect(element.get('type')).toBe(REACT_TYPE);
    });

    it('should accept custom attributes', () => {
      const element = createElement({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        data: { label: 'Test' },
      });

      expect(element.get('data')).toEqual({ label: 'Test' });
    });
  });

  describe('REACT_TYPE', () => {
    it('should be defined', () => {
      expect(REACT_TYPE).toBe('ReactElement');
    });
  });
});
