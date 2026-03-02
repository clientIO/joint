import * as linkUtilities from '../link-utilities';

describe('link-utilities', () => {
  describe('getLinkId', () => {
    it('returns id if passed a string', () => {
      expect(linkUtilities.getCellId('foo')).toBe('foo');
    });
    it('returns id property if passed an object', () => {
      expect(linkUtilities.getCellId({ id: 'bar' })).toBe('bar');
    });
    it('returns undefined if object has no id', () => {
      expect(linkUtilities.getCellId({})).toBeUndefined();
    });
  });
});
