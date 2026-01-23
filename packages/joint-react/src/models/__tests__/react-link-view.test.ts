import { ReactLinkView } from '../react-link-view';

describe('ReactLinkView', () => {
  it('should be a view class that extends dia.LinkView', () => {
    expect(ReactLinkView).toBeDefined();
    expect(typeof ReactLinkView.extend).toBe('function');
  });
});
