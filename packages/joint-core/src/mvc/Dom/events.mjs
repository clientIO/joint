// TODO: should not read config outside the mvc package
import { config } from '../../config/index.mjs';
import $ from './Dom.mjs';


// Special events

const special = Object.create(null);

export default special;

special.load = {
    // Prevent triggered image.load events from bubbling to window.load
    noBubble: true,
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in $.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
[
    ['mouseenter', 'mouseover'],
    ['mouseleave', 'mouseout'],
    ['pointerenter', 'pointerover'],
    ['pointerleave', 'pointerout'],
].forEach(([orig, fix]) => {
    special[orig] = {
        delegateType: fix,
        bindType: fix,
        handle: function(event) {
            const target = this;
            const related = event.relatedTarget;
            const handleObj = event.handleObj;
            let ret;
            // For mouseenter/leave call the handler if related is outside the target.
            // NB: No relatedTarget if the mouse left/entered the browser window
            if (!related || !target.contains(related)) {
                event.type = handleObj.origType;
                ret = handleObj.handler.apply(target, arguments);
                event.type = fix;
            }
            return ret;
        },
    };
});


// Gestures

const maxDelay = config.doubleTapInterval;
const minDelay = 30;

special.dbltap = {
    bindType: 'touchend',
    delegateType: 'touchend',
    handle: function(event, ...args) {
        const { handleObj, target } = event;
        const targetData = $.data.create(target);
        const now = new Date().getTime();
        const delta = 'lastTouch' in targetData ? now - targetData.lastTouch : 0;
        if (delta < maxDelay && delta > minDelay) {
            targetData.lastTouch = null;
            event.type = handleObj.origType;
            // let $ handle the triggering of "dbltap" event handlers
            handleObj.handler.call(this, event, ...args);
        } else {
            targetData.lastTouch = now;
        }
    }
};
