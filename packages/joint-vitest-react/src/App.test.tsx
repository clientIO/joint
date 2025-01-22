import React from 'react';
import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

test('renders JointJS paper', () => {
    //@ts-ignore
    console.log(globalThis.zbynek);
    //@ts-ignore
    console.log(globalThis.zbynek2);
    console.log(globalThis.SVGPathElement);
    console.log(globalThis.SVGAngle);

    render(<App />);
    const paper = document.querySelector('.joint-paper');
    expect(document).toContain(paper);
});
