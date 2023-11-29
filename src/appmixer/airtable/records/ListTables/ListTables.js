'use strict';

const { sendArrayOutput, isAppmixerVariable } = require('../../airtable-commons');

module.exports = {

    // Private component used only to list tables in a base in the inspector.
    async receive(context) {

        const generateOutputPortOptions = context.properties.generateOutputPortOptions;
        const { baseId, outputType, isSource } = context.messages.in.content;
        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType);
        }
        if (!baseId || isAppmixerVariable(baseId)) {
            // This is the case when component is added to the inspector and user didn't select a base yet.
            // We don't want to throw an error yet.
            return context.sendJson({ items: [] }, 'out');
        }

        const cacheKey = 'airtable_tables_' + baseId;
        let lock;
        try {
            lock = await context.lock(baseId);

            // Checking and returning cache only if this is a call from another component.
            if (isSource) {
                const tablesCached = await context.staticCache.get(cacheKey);
                if (tablesCached) {
                    return context.sendJson({ items: tablesCached }, 'out');
                }
            }

            const { data } = await context.httpRequest.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
                headers: {
                    Authorization: `Bearer ${context.auth.accessToken}`
                }
            });
            const { tables } = data;

            // Cache the tables for 20 seconds unless specified otherwise in the config.
            // Note that we only need name and id, so we can save some space in the cache.
            // Caching only if this is a call from another component.
            if (isSource) {
                await context.staticCache.set(
                    cacheKey,
                    tables.map(table => ({ id: table.id, name: table.name })),
                    context.config.listTablesCacheTTL || (20 * 1000)
                );

                return context.sendJson({ items: tables }, 'out');
            }

            // Returning values to the flow.
            await sendArrayOutput({ context, outputType, records: tables });
        } finally {
            lock?.unlock();
        }
    },

    toSelectArray({ items }) {

        return items.map(table => {
            return { label: table.name, value: table.id };
        });
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'object') {
            return context.sendJson(
                [
                    { label: 'description', value: 'description' },
                    {
                        label: 'fields', value: 'fields',
                        schema: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    description: { label: 'description', value: 'description' },
                                    id: { label: 'id', value: 'id' },
                                    name: { label: 'name', value: 'name' },
                                    type: { label: 'type', value: 'type' }
                                }
                            }
                        }
                    },
                    { label: 'id', value: 'id' },
                    { label: 'name', value: 'name' },
                    { label: 'primaryFieldId', value: 'primaryFieldId' },
                    {
                        label: 'views', value: 'views',
                        schema: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { label: 'id', value: 'id' },
                                    name: { label: 'name', value: 'name' },
                                    type: { label: 'type', value: 'type' }
                                }
                            }
                        }
                    }
                ],
                'out'
            );
        } else if (outputType === 'array') {
            return context.sendJson(
                [
                    {
                        label: 'Array', value: 'array',
                        schema: { type: 'array',
                            items: { type: 'object',
                                properties: {
                                    description: { type: 'string', title: 'description' },
                                    fields: { type: 'object', title: 'fields',
                                        schema: { type: 'array',
                                            items: { type: 'object',
                                                properties: {
                                                    description: { label: 'description', value: 'description' },
                                                    id: { label: 'id', value: 'id' },
                                                    name: { label: 'name', value: 'name' },
                                                    type: { label: 'type', value: 'type' }
                                                }
                                            }
                                        }
                                    },
                                    id: { type: 'string', title: 'id' },
                                    name: { type: 'string', title: 'name' },
                                    primaryFieldId: { type: 'string', title: 'primaryFieldId' },
                                    views: { type: 'object', title: 'views',
                                        schema: { type: 'array',
                                            items: { type: 'object',
                                                properties: {
                                                    id: { label: 'id', value: 'id' },
                                                    name: { label: 'name', value: 'name' },
                                                    type: { label: 'type', value: 'type' }
                                                }
                                            }
                                        }
                                    }
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
