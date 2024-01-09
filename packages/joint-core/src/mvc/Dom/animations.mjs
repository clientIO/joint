export function animate(properties, opt = {}) {
    let {
        duration = 400,
        easing = 'ease-in-out',
        delay = 0,
        complete
    } = opt;

    const that = this;
    const [node] = this;

    let endEvent = 'transitionend';
    let fired = false;

    // Convert milliseconds to seconds for CSS
    duration = duration / 1000;
    delay = delay / 1000;

    // Set up CSS values for transition or keyframe animation
    var cssValues = {};
    if (typeof properties === 'string') {
        // Keyframe animation
        cssValues['animation-name'] = properties;
        cssValues['animation-duration'] = duration + 's';
        cssValues['animation-delay'] = delay + 's';
        cssValues['animation-timing-function'] = easing;
        endEvent = 'animationend';
    } else {
        // CSS transitions
        var transitionProperties = [];
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
        if (typeof event !== 'undefined') {
            if (event.target !== event.currentTarget) return; // makes sure the event didn't bubble from "below"
            event.target.removeEventListener(endEvent, wrappedCallback);
        } else
            node.removeEventListener(endEvent, wrappedCallback); // triggered by setTimeout

        fired = true;
        // $(this).css(cssReset);
        complete && complete.call(node);
    };
    if (duration > 0){
        node.addEventListener(endEvent, wrappedCallback);
        // transitionEnd is not always firing on older Android phones
        // so make sure it gets fired
        setTimeout(function(){
            if (fired) return;
            wrappedCallback.call(that);
        }, ((duration + delay) * 1000) + 25);
    }

    this.css(cssValues);

    if (duration <= 0) setTimeout(function() {
        for (var i = 0; i < that.length; i++) wrappedCallback.call(that[i]);
    }, 0);

    return this;
}

export function stop() {
    // TBD
}
