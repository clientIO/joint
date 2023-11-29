'use strict';

const Airtable = require('airtable');

module.exports = {

    async receive(context) {

        const {
            baseId, tableIdOrName, recordId, fields,
            replace,
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
        const data = { fields: fieldsObject, id: recordId };

        context.log({ step: 'Updating record', data, queryParams });

        let result;
        if (replace === true) {
            result = await base(tableIdOrName).replace([data], queryParams);
        } else {
            result = await base(tableIdOrName).update([data], queryParams);
        }
        // Make it the same as in REST API
        // eslint-disable-next-line no-underscore-dangle
        const item = result[0]._rawJson;

        context.sendJson(item, 'out');
    }
};
