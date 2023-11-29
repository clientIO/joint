'use strict';

const Airtable = require('airtable');

module.exports = {

    async receive(context) {

        const { baseId, tableIdOrName, recordId } = context.messages.in.content;

        Airtable.configure({
            endpointUrl: 'https://api.airtable.com',
            apiKey: context.auth.accessToken
        });
        const base = Airtable.base(baseId);

        const result = await base(tableIdOrName).find(recordId);
        // Make it the same as in REST API
        // eslint-disable-next-line no-underscore-dangle
        const item = result._rawJson;

        context.sendJson(item, 'out');
    }
};
