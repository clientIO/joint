'use strict';

module.exports = {

    rules: [
        {
            limit: 5, // Official limit is 5 requests per second.
            window: 1000,
            queueing: 'fifo',
            resource: 'messages.send',
            scope: 'userId'
        }
    ]
};
