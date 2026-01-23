import { ReactElementView } from '../react-element-view';

describe('ReactElementView', () => {
  it('should be a view class that extends dia.ElementView', () => {
    expect(ReactElementView).toBeDefined();
    expect(typeof ReactElementView.extend).toBe('function');
  });
});
