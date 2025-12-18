import { ReactElement, createElement, REACT_TYPE } from '../react-element';
import { dia } from '@joint/core';

describe('react-element', () => {
  describe('ReactElement', () => {
    it('should create a ReactElement instance', () => {
      const element = new ReactElement({
        id: '1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(ReactElement);
      expect(element).toBeInstanceOf(dia.Element);
      expect(element.get('type')).toBe(REACT_TYPE);
    });

    it('should have default attributes', () => {
      const element = new ReactElement({
        id: '1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      const defaults = element.defaults();
      expect(defaults.type).toBe(REACT_TYPE);
      expect(defaults.data).toEqual({});
      expect(defaults.attrs).toHaveProperty('root');
      expect(defaults.attrs).toHaveProperty('placeholder');
    });

    it('should have placeholder markup', () => {
      const element = new ReactElement({
        id: '1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element.markup).toBeDefined();
    });

    it('should accept custom attributes', () => {
      const element = new ReactElement({
        id: '1',
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
        id: '1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(element).toBeInstanceOf(ReactElement);
    });
  });

  describe('createElement', () => {
    it('should create a ReactElement instance', () => {
      const element = createElement({
        id: '1',
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
        id: '1',
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












