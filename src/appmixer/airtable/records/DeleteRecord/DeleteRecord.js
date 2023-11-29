'use strict';

const Airtable = require('airtable');

module.exports = {

    async receive(context) {

        const {
            baseId, tableIdOrName, recordId
        } = context.messages.in.content;

        Airtable.configure({
            endpointUrl: 'https://api.airtable.com',
            apiKey: context.auth.accessToken
        });
        const base = Airtable.base(baseId);
        const { id } = await base(tableIdOrName).destroy(recordId);

        context.sendJson({ id }, 'out');
    }
};
