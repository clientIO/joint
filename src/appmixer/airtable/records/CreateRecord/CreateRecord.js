'use strict';

const Airtable = require('airtable');

module.exports = {

    async receive(context) {

        const {
            baseId, tableIdOrName, fields,
            returnFieldsByFieldId = false, typecast = false
        } = context.messages.in.content;

        Airtable.configure({
            endpointUrl: 'https://api.airtable.com',
            apiKey: context.auth.accessToken
        });
        const base = Airtable.base(baseId);

        const queryParams = {
            returnFieldsByFieldId,
            typecast
        };

        let fieldsObject = {};
        try {
            fieldsObject = JSON.parse(fields);
        } catch (error) {
            throw new context.CancelError('Invalid fields JSON');
        }

        context.log({ step: 'Creating record', queryParams, fieldsObject });

        const result = await base(tableIdOrName).create([{ fields: fieldsObject }], queryParams);

        // Make it the same as in REST API
        // eslint-disable-next-line no-underscore-dangle
        const item = result[0]._rawJson;

        context.sendJson(item, 'out');
    }
};
