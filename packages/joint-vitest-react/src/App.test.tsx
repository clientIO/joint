import React from 'react';
import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

test('renders JointJS paper', () => {
    console.log('--- SVGPathElement ---');
    console.log(globalThis.SVGPathElement);
    console.log('--- SVGAngle ---');
    console.log(globalThis.SVGAngle);
    console.log('--- SVGSVGElement prototype functions ---');
    console.log(globalThis.SVGSVGElement.prototype.createSVGMatrix);
    console.log(globalThis.SVGSVGElement.prototype.createSVGPoint);
    console.log(globalThis.SVGSVGElement.prototype.createSVGTransform);
    console.log('--- test values ---');
    //@ts-ignore
    console.log(globalThis.zbynek);
    //@ts-ignore
    console.log(globalThis.zbynek2);

    render(<App />);
    const paper = document.querySelector('.joint-paper');
    expect(document).toContain(paper);
});
