import { PortalElement, PORTAL_ELEMENT_TYPE, PORTAL_SELECTOR } from '../portal-element';
import { dia } from '@joint/core';

function createElement<Attributes = dia.Element.Attributes>(
  options?: Attributes & dia.Element.Attributes
) {
  return new PortalElement(options);
}

describe('portal-element', () => {
  describe('PortalElement', () => {
    it('should create a PortalElement instance', () => {
      const element = new PortalElement({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(PortalElement);
      expect(element).toBeInstanceOf(dia.Element);
      expect(element.get('type')).toBe(PORTAL_ELEMENT_TYPE);
    });

    it('should have default attributes', () => {
      const element = new PortalElement({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      const defaults = element.defaults();
      expect(defaults.type).toBe(PORTAL_ELEMENT_TYPE);
    });

    it('should accept custom attributes', () => {
      const element = new PortalElement({
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

      const element = new PortalElement<CustomAttributes>({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(PortalElement);
    });

    describe('markup', () => {
      it('should have markup with a portal group', () => {
        const element = new PortalElement();
        expect(element.markup).toEqual([
          {
            tagName: 'g',
            selector: PORTAL_SELECTOR,
          },
        ]);
      });
    });
  });

  describe('createElement', () => {
    it('should create a PortalElement instance', () => {
      const element = createElement({
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(PortalElement);
      expect(element.get('type')).toBe(PORTAL_ELEMENT_TYPE);
    });

    it('should create element without options', () => {
      const element = createElement();

      expect(element).toBeInstanceOf(PortalElement);
      expect(element.get('type')).toBe(PORTAL_ELEMENT_TYPE);
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

  describe('PORTAL_ELEMENT_TYPE', () => {
    it('should be defined', () => {
      expect(PORTAL_ELEMENT_TYPE).toBe('PortalElement');
    });
  });
});
