import { ElementModel, ELEMENT_MODEL_TYPE, PORTAL_SELECTOR } from '../element-model';
import { dia } from '@joint/core';

function createElement<Attributes = dia.Element.Attributes>(
  options?: Attributes & dia.Element.Attributes
) {
  return new ElementModel(options);
}

describe('element-model', () => {
  describe('element', () => {
    it('should create a ElementModel instance', () => {
      const element = new ElementModel({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(ElementModel);
      expect(element).toBeInstanceOf(dia.Element);
      expect(element.get('type')).toBe(ELEMENT_MODEL_TYPE);
    });

    it('should have default attributes', () => {
      const element = new ElementModel({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      const defaults = element.defaults();
      expect(defaults.type).toBe(ELEMENT_MODEL_TYPE);
    });

    it('should accept custom attributes', () => {
      const element = new ElementModel({
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

      const element = new ElementModel<CustomAttributes>({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(ElementModel);
    });

    describe('markup', () => {
      it('should have markup with a portal group', () => {
        const element = new ElementModel();
        expect(element.markup).toEqual([
          {
            tagName: 'g',
            selector: PORTAL_SELECTOR,
          },
        ]);
      });

      it('should expose portalSelector pointing at the portal group', () => {
        const element = new ElementModel();
        expect(element.portalSelector).toBe(PORTAL_SELECTOR);
      });
    });
  });

  describe('createElement', () => {
    it('should create a ElementModel instance', () => {
      const element = createElement({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(ElementModel);
      expect(element.get('type')).toBe(ELEMENT_MODEL_TYPE);
    });

    it('should create element without options', () => {
      const element = createElement();

      expect(element).toBeInstanceOf(ElementModel);
      expect(element.get('type')).toBe(ELEMENT_MODEL_TYPE);
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

  describe('ELEMENT_MODEL_TYPE', () => {
    it('should be defined', () => {
      expect(ELEMENT_MODEL_TYPE).toBe('element');
    });
  });
});
