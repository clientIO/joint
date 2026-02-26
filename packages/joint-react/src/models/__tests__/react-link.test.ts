import { ReactLink, REACT_LINK_TYPE } from '../react-link';

describe('ReactLink', () => {
  describe('markup', () => {
    it('should have wrapper and line path markup for link rendering', () => {
      const link = new ReactLink();
      expect(link.markup).toEqual([
        {
          tagName: 'path',
          selector: 'wrapper',
          attributes: {
            fill: 'none',
            cursor: 'pointer',
            stroke: 'transparent',
            strokeLinecap: 'round',
            strokeWidth: 10,
            strokeLinejoin: 'round',
          },
        },
        {
          tagName: 'path',
          selector: 'line',
          attributes: {
            fill: 'none',
            pointerEvents: 'none',
            stroke: '#333333',
            strokeWidth: 2,
            strokeLinejoin: 'round',
          },
        },
      ]);
    });
  });

  describe('defaults', () => {
    it('should have REACT_LINK_TYPE as type', () => {
      const link = new ReactLink();
      expect(link.get('type')).toBe(REACT_LINK_TYPE);
    });

    it('should have connection: true attrs for path computation', () => {
      // This is critical for JointJS to compute the link path (d attribute)
      // Without connection: true, the path d attribute will be empty/null
      const link = new ReactLink();
      const attributes = link.get('attrs');

      expect(attributes?.wrapper?.connection).toBe(true);
      expect(attributes?.line?.connection).toBe(true);
    });
  });

  describe('defaultLabel', () => {
    it('should have label markup with labelBody and labelText selectors', () => {
      const link = new ReactLink();
      expect(link.defaultLabel.markup).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tagName: 'rect', selector: 'labelBody' }),
          expect.objectContaining({ tagName: 'text', selector: 'labelText' }),
        ])
      );
    });

    it('should have default label position at 0.5', () => {
      const link = new ReactLink();
      expect(link.defaultLabel.position).toEqual({ distance: 0.5 });
    });
  });
});
