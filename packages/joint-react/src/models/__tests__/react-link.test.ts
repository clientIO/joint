import { ReactLink, REACT_LINK_TYPE } from '../react-link';

describe('ReactLink', () => {
  describe('markup', () => {
    it('should have wrapper and line path markup for link rendering', () => {
      const link = new ReactLink({ id: 'test' });
      expect(link.markup).toEqual([
        {
          tagName: 'path',
          selector: 'wrapper',
          attributes: {
            fill: 'none',
            cursor: 'pointer',
            stroke: 'transparent',
            'stroke-linecap': 'round',
          },
        },
        {
          tagName: 'path',
          selector: 'line',
          attributes: {
            fill: 'none',
            'pointer-events': 'none',
          },
        },
      ]);
    });
  });

  describe('defaults', () => {
    it('should have REACT_LINK_TYPE as type', () => {
      const link = new ReactLink({ id: 'test' });
      expect(link.get('type')).toBe(REACT_LINK_TYPE);
    });

    it('should have connection: true attrs for path computation', () => {
      // This is critical for JointJS to compute the link path (d attribute)
      // Without connection: true, the path d attribute will be empty/null
      const link = new ReactLink({ id: 'test' });
      const attributes = link.get('attrs');

      expect(attributes?.wrapper?.connection).toBe(true);
      expect(attributes?.line?.connection).toBe(true);
    });

    it('should have default stroke and strokeWidth for line', () => {
      const link = new ReactLink({ id: 'test' });
      const attributes = link.get('attrs');

      expect(attributes?.line?.stroke).toBe('#333333');
      expect(attributes?.line?.strokeWidth).toBe(2);
      expect(attributes?.line?.strokeLinejoin).toBe('round');
    });

    it('should have default strokeWidth for wrapper (click target)', () => {
      const link = new ReactLink({ id: 'test' });
      const attributes = link.get('attrs');

      expect(attributes?.wrapper?.strokeWidth).toBe(10);
      expect(attributes?.wrapper?.strokeLinejoin).toBe('round');
    });
  });
});
