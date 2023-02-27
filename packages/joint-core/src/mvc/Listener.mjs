import Backbone from 'backbone';
import V from '../V/index.mjs';

export class Listener {
    constructor(...callbackArguments) {
        this.callbackArguments = callbackArguments;
    }

    listenTo(object, evt, ...args) {
        const { callbackArguments } = this;
        // signature 1 - (object, eventHashMap, context)
        if (V.isObject(evt)) {
            const [context = null] = args;
            Object.entries(evt).forEach(([eventName, cb]) => {
                if (typeof cb !== 'function') return;
                // Invoke the callback with callbackArguments passed first
                if (context || callbackArguments.length > 0) cb = cb.bind(context, ...callbackArguments);
                Backbone.Events.listenTo.call(this, object, eventName, cb);
            });
        }
        // signature 2 - (object, event, callback, context)
        else if (typeof evt === 'string' && typeof args[0] === 'function') {
            let [cb, context = null] = args;
            // Invoke the callback with callbackArguments passed first
            if (context || callbackArguments.length > 0) cb = cb.bind(context, ...callbackArguments);
            Backbone.Events.listenTo.call(this, object, evt, cb);
        }
    }

    stopListening() {
        Backbone.Events.stopListening.call(this);
    }
}
