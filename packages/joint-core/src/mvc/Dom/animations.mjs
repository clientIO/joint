import { nextFrame, cancelFrame } from '../../util/util.mjs';
import { dataPriv } from './vars.mjs';

const animationKey = 'animationFrameId';
const cssReset = {};

cssReset['transition-property'] =
cssReset['transition-duration'] =
cssReset['transition-delay'] =
cssReset['transition-timing-function'] =
cssReset['animation-name'] =
cssReset['animation-duration'] =
cssReset['animation-delay'] =
cssReset['animation-timing-function'] = '';

export function animate(properties, opt = {}) {
    if (this.length === 0) return this;
    this.stop();
    let {
        duration = 400,
        easing = 'ease-in-out',
        delay = 0,
        complete
    } = opt;
    let endEvent = 'transitionend';
    // Convert milliseconds to seconds for CSS
    duration = duration / 1000;
    delay = delay / 1000;
    const frameId = nextFrame(() => {
        if (duration <= 0) {
            // Note: delay is ignored when duration is 0
            this.css(properties);
            if (complete) {
                for (let i = 0; i < this.length; i++) {
                    complete.call(this[i]);
                }
            }
            return;
        }
        // Set up CSS values for transition or keyframe animation
        const cssValues = {};
        if (typeof properties === 'string') {
        // Keyframe animation
            cssValues['animation-name'] = properties;
            cssValues['animation-duration'] = duration + 's';
            cssValues['animation-delay'] = delay + 's';
            cssValues['animation-timing-function'] = easing;
            endEvent = 'animationend';
        } else {
        // CSS transitions
            const transitionProperties = [];
            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    cssValues[key] = properties[key];
                    transitionProperties.push(key);
                }
            }
            if (duration > 0) {
                cssValues['transition-property'] = transitionProperties.join(', ');
                cssValues['transition-duration'] = duration + 's';
                cssValues['transition-delay'] = delay + 's';
                cssValues['transition-timing-function'] = easing;
            }
        }
        this.on(`${endEvent}.animate`, (event) => {
            this.stop();
            complete && complete.call(event.target);
        });
        this.css(cssValues);
    });
    for (let i = 0; i < this.length; i++) {
        dataPriv.set(this[i], animationKey, frameId);
    }
    return this;
}

export function stop() {
    for (let i = 0; i < this.length; i++) {
        const frameId = dataPriv.get(this[i], animationKey);
        if (frameId) {
            cancelFrame(frameId);
            dataPriv.remove(this[i], animationKey);
        }
    }
    this.css(cssReset);
    this.off('.animate');
    return this;
}
