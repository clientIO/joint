import { ReactLink, REACT_LINK_TYPE } from '../react-link';

describe('ReactLink', () => {
  describe('markup', () => {
    it('should have wrapper and line path markup with structural attributes only', () => {
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
            strokeLinejoin: 'round',
          },
        },
        {
          tagName: 'path',
          selector: 'line',
          attributes: {
            fill: 'none',
            pointerEvents: 'none',
            strokeLinejoin: 'round',
          },
        },
      ]);
    });

    it('should not contain theme-derived visual properties', () => {
      const link = new ReactLink();
      const wrapper = link.markup[0] as { attributes: Record<string, unknown> };
      const line = link.markup[1] as { attributes: Record<string, unknown> };

      // strokeWidth and stroke color come from the mapper, not the model
      expect(wrapper.attributes).not.toHaveProperty('strokeWidth');
      expect(line.attributes).not.toHaveProperty('stroke');
      expect(line.attributes).not.toHaveProperty('strokeWidth');
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

  it('should not have a defaultLabel (applied by mapper instead)', () => {
    const link = new ReactLink();
    expect(link.defaultLabel).toBeUndefined();
  });
});
