'use strict';

const Airtable = require('airtable');
const { sendArrayOutput } = require('../../airtable-commons');

module.exports = {

    async receive(context) {

        const generateOutputPortOptions = context.properties.generateOutputPortOptions;
        const {
            baseId, tableIdOrName,
            // Optional query params
            fields,
            filterByFormula,
            maxRecords = 10000,
            // Page size and offset doesn't make sense as the SDK does pagination automatically.
            // pageSize,
            // offset,
            sort,
            view,
            cellFormat = 'json',
            timeZone,
            userLocale,
            // method ?: string;
            returnFieldsByFieldId,
            recordMetadata,
            // Appmixer specific
            outputType
        } = context.messages.in.content;

        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType);
        }

        Airtable.configure({
            endpointUrl: 'https://api.airtable.com',
            apiKey: context.auth.accessToken
        });
        const base = Airtable.base(baseId);

        const queryParams = {
            // If not provided by user, use our default value.
            maxRecords,
            // If not provided by user, use our default value json.
            cellFormat
        };
        if (fields) {
            queryParams.fields = fields.trim().split(',');
        }
        if (filterByFormula) {
            queryParams.filterByFormula = filterByFormula.trim();
        }
        if (sort) {
            try {
                queryParams.sort = JSON.parse(sort);
            } catch (e) {
                // noop
                context.log({ step: 'sort', error: e });
            }
        }
        if (view) {
            queryParams.view = view;
        }
        if (timeZone) {
            queryParams.timeZone = timeZone;
        }
        if (userLocale) {
            queryParams.userLocale = userLocale;
        }
        if (returnFieldsByFieldId) {
            queryParams.returnFieldsByFieldId = returnFieldsByFieldId;
        }
        if (recordMetadata) {
            // This one works only with ['commentCount']. If provided other values, it fails with 422: INVALID_REQUEST_UNKNOWN.
            queryParams.recordMetadata = ['commentCount'];
        }
        context.log({ step: 'queryParams', queryParams });

        const all = await base(tableIdOrName).select(queryParams).all();
        const items = all.map(item => {
            const record = {
                // eslint-disable-next-line no-underscore-dangle
                createdTime: item.createdTime || item._rawJson?.createdTime,
                fields: item.fields,
                id: item.id
            };

            if (recordMetadata) {
                record.commentCount = item.commentCount;
            }

            return record;
        });

        await sendArrayOutput({ context, outputType, records: items });
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'item') {
            return context.sendJson(
                [
                    { label: 'createdTime', value: 'createdTime' },
                    { label: 'fields', value: 'fields',
                        // We can't know table columns beforehand, so we'll just use empty object as schema.
                        schema: { type: 'object' }
                    },
                    { label: 'id', value: 'id' },
                    { label: 'commentCount', value: 'commentCount' }
                ],
                'out'
            );
        } else if (outputType === 'array') {
            return context.sendJson(
                [
                    { label: 'Result', value: 'result',
                        schema: { type: 'array',
                            items: { type: 'object',
                                properties: {
                                    createdTime: { type: 'string', title: 'createdTime' },
                                    fields: { type: 'object', title: 'fields',
                                        // We can't know table columns beforehand, so we'll just use empty object as schema.
                                        schema: { type: 'object' }
                                    },
                                    id: { type: 'string', title: 'id' },
                                    commentCount: { type: 'number', title: 'commentCount' }
                                }
                            }
                        }
                    }
                ],
                'out'
            );
        } else {
            // file
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};
