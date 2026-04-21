import { LinkModel, LINK_MODEL_TYPE } from '../link-model';
import { PORTAL_SELECTOR } from '../element-model';

describe('LinkModel', () => {
  describe('markup', () => {
    it('should have wrapper and line path markup with structural attributes only', () => {
      const link = new LinkModel();
      expect(link.markup).toEqual([
        {
          tagName: 'path',
          selector: 'wrapper',
          className: 'jj-link-wrapper',
          attributes: {
            fill: 'none',
            cursor: 'pointer',
            strokeLinejoin: 'round',
          },
        },
        {
          tagName: 'path',
          selector: 'line',
          className: 'jj-link-line',
          attributes: {
            fill: 'none',
            pointerEvents: 'none',
            strokeLinejoin: 'round',
          },
        },
        {
          tagName: 'g',
          selector: PORTAL_SELECTOR,
        },
      ]);
    });

    it('should not contain theme-derived visual properties', () => {
      const link = new LinkModel();
      const wrapper = link.markup[0] as { attributes: Record<string, unknown> };
      const line = link.markup[1] as { attributes: Record<string, unknown> };

      // strokeWidth and stroke color come from the mapper, not the model
      expect(wrapper.attributes).not.toHaveProperty('strokeWidth');
      expect(line.attributes).not.toHaveProperty('stroke');
      expect(line.attributes).not.toHaveProperty('strokeWidth');
    });
  });

  describe('defaults', () => {
    it('should have LINK_MODEL_TYPE as type', () => {
      const link = new LinkModel();
      expect(link.get('type')).toBe(LINK_MODEL_TYPE);
    });

    it('should have connection: true attrs for path computation', () => {
      // This is critical for JointJS to compute the link path (d attribute)
      // Without connection: true, the path d attribute will be empty/null
      const link = new LinkModel();
      const attributes = link.get('attrs');

      expect(attributes?.wrapper?.connection).toBe(true);
      expect(attributes?.line?.connection).toBe(true);
    });
  });

  it('should not have a defaultLabel (applied by mapper instead)', () => {
    const link = new LinkModel();
    expect(link.defaultLabel).toBeUndefined();
  });
});
