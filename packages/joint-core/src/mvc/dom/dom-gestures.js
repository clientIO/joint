import { config } from '../../config/index.mjs';
import $ from '../Dom.mjs';

const DoubleTapEventName = 'dbltap';
if ($.event && !(DoubleTapEventName in $.event.special)) {
    const maxDelay = config.doubleTapInterval;
    const minDelay = 30;
    $.event.special[DoubleTapEventName] = {
        bindType: 'touchend',
        delegateType: 'touchend',
        handle: function(event, ...args) {
            const { handleObj, target } = event;
            const targetData  = $.data.get(target);
            const now = new Date().getTime();
            const delta = 'lastTouch' in targetData ? now - targetData.lastTouch : 0;
            if (delta < maxDelay && delta > minDelay) {
                targetData.lastTouch = null;
                event.type = handleObj.origType;
                // let jQuery handle the triggering of "dbltap" event handlers
                handleObj.handler.call(this, event, ...args);
            } else {
                targetData.lastTouch = now;
            }
        }
    };
}
