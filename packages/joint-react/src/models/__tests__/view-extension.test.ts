import { ReactElementView, ReactLinkView } from '../../index';

describe('View Extension', () => {
  describe('ReactElementView', () => {
    it('should be defined and extendable', () => {
      expect(ReactElementView).toBeDefined();
      expect(typeof ReactElementView.extend).toBe('function');
    });

    it('should allow extending with custom behavior', () => {
      const CustomView = ReactElementView.extend({
        customMethod() {
          return 'custom';
        },
      });

      expect(CustomView).toBeDefined();
      expect(typeof CustomView.extend).toBe('function');
    });
  });

  describe('ReactLinkView', () => {
    it('should be defined and extendable', () => {
      expect(ReactLinkView).toBeDefined();
      expect(typeof ReactLinkView.extend).toBe('function');
    });

    it('should allow extending with custom behavior', () => {
      const CustomView = ReactLinkView.extend({
        customMethod() {
          return 'custom';
        },
      });

      expect(CustomView).toBeDefined();
      expect(typeof CustomView.extend).toBe('function');
    });
  });
});
