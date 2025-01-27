import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../App.vue';

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

    const wrapper = mount(App);
    //console.log(JSON.stringify(wrapper.html()));
    expect(wrapper.find('.joint-paper').exists()).toBe(true);
});
