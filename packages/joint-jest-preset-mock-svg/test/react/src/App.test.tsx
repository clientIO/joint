import { render } from '@testing-library/react';
import App from './App';

// `App` exercises the APIs JSDOM is missing - text wrapping (`getBBox`,
// `getComputedTextLength`), `getScreenCTM().inverse()`, `transform.baseVal` -
// so rendering it at all is the assertion that matters. Without the preset it
// throws before the paper is ever attached.
test('renders JointJS paper', () => {
    render(<App />);
    expect(document.querySelector('.joint-paper')).not.toBeNull();
    expect(document.querySelector('.joint-element')).not.toBeNull();
});
