import * as linkUtilities from '../link-utilities';

describe('link-utilities', () => {
  describe('getLinkId', () => {
    it('returns id if passed a string', () => {
      expect(linkUtilities.getLinkId('foo')).toBe('foo');
    });
    it('returns id property if passed an object', () => {
      expect(linkUtilities.getLinkId({ id: 'bar' })).toBe('bar');
    });
    it('returns undefined if object has no id', () => {
      expect(linkUtilities.getLinkId({})).toBeUndefined();
    });
  });

  describe('getLinkPortId', () => {
    it('returns port property if passed an object', () => {
      expect(linkUtilities.getLinkPortId({ port: 'baz' })).toBe('baz');
    });
    it('returns undefined if object has no port', () => {
      expect(linkUtilities.getLinkPortId({})).toBeUndefined();
    });
    it('returns undefined if passed a string', () => {
      expect(linkUtilities.getLinkPortId('foo')).toBeUndefined();
    });
  });

  describe('getLinkMagnet', () => {
    it('returns magnet property if passed an object', () => {
      expect(linkUtilities.getLinkMagnet({ magnet: 'mag' })).toBe('mag');
    });
    it('returns undefined if object has no magnet', () => {
      expect(linkUtilities.getLinkMagnet({})).toBeUndefined();
    });
    it('returns undefined if passed a string', () => {
      expect(linkUtilities.getLinkMagnet('foo')).toBeUndefined();
    });
  });
});
