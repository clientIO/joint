import $ from './Dom.mjs';
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
    this.stop();
    for (let i = 0; i < this.length; i++) {
        animateNode(this[i], properties, opt);
    }
    return this;
}

function animateNode(el, properties, opt = {}) {

    let {
        duration = 400,
        easing = 'ease-in-out',
        delay = 0,
        complete
    } = opt;

    const delayId = setTimeout(function() {

        const $el = $(el);
        let fired = false;
        let endEvent = 'transitionend';

        // Convert milliseconds to seconds for CSS
        duration = duration / 1000;
        delay = delay / 1000;

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

        const wrappedCallback = function(event){
            if (event) {
                if (event.target !== event.currentTarget) return; // makes sure the event didn't bubble from "below"
                event.target.removeEventListener(endEvent, wrappedCallback);
            } else {
                el.removeEventListener(endEvent, wrappedCallback); // triggered by setTimeout
            }
            fired = true;
            $el.css(cssReset);
            complete && complete.call(el);
        };

        if (duration > 0){
            el.addEventListener(endEvent, wrappedCallback);
            // transitionEnd is not always firing on older Android phones
            // so make sure it gets fired
            const callbackId = setTimeout(function() {
                if (fired) return;
                wrappedCallback(null);
            }, ((duration + delay) * 1000) + 25);

            dataPriv.set(el, animationKey, {
                id: callbackId,
                stop: () => {
                    clearTimeout(callbackId);
                    el.removeEventListener(endEvent, wrappedCallback);
                }
            });
        }

        $el.css(cssValues);

        if (duration <= 0) {
            wrappedCallback(null);
        }
    });

    dataPriv.set(el, animationKey, {
        stop: () => clearTimeout(delayId)
    });
}

export function stop() {
    for (let i = 0; i < this.length; i++) {
        const el = this[i];
        const animation = dataPriv.get(el, animationKey);
        if (!animation) continue;
        animation.stop();
        dataPriv.remove(el, animationKey);
    }
    this.css(cssReset);
    return this;
}
