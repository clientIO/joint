'use strict';

const { sendArrayOutput } = require('../../airtable-commons');

module.exports = {

    // Private component used only to list bases in the inspector for other components.
    async receive(context) {

        const generateOutputPortOptions = context.properties.generateOutputPortOptions;
        const { outputType, isSource } = context.messages.in.content;
        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType);
        }

        const cacheKey = 'airtable_bases_' + context.auth.accessToken;
        let lock;
        try {
            lock = await context.lock(context.auth.accessToken);

            // Checking and returning cache only if this is a call from another component.
            if (isSource) {
                const basesCached = await context.staticCache.get(cacheKey);
                if (basesCached) {
                    return context.sendJson({ items: basesCached }, 'out');
                }
            }

            const { data } = await context.httpRequest.get('https://api.airtable.com/v0/meta/bases', {
                headers: {
                    Authorization: `Bearer ${context.auth.accessToken}`
                }
            });
            const { bases } = data;

            // Cache the tables for 20 seconds unless specified otherwise in the config.
            // Note that we only need name and id, so we can save some space in the cache.
            // Caching only if this is a call from another component.
            if (isSource) {
                await context.staticCache.set(
                    cacheKey,
                    bases.map(item => ({ id: item.id, name: item.name })),
                    context.config.listBasesCacheTTL || (20 * 1000)
                );

                // Returning values into another component.
                return context.sendJson({ items: bases }, 'out');
            }

            // Returning values to the flow.
            await sendArrayOutput({ context, outputType, records: bases });
        } finally {
            lock?.unlock();
        }
    },

    toSelectArray({ items }) {

        return items.map(base => {
            return { label: base.name, value: base.id };
        });
    },

    getOutputPortOptions(context, outputType) {

        if (outputType === 'object') {
            return context.sendJson(
                [
                    { label: 'id', value: 'id' },
                    { label: 'name', value: 'name' },
                    { label: 'permissionLevel', value: 'permissionLevel' }
                ],
                'out'
            );
        } else if (outputType === 'array') {
            return context.sendJson(
                [
                    {
                        label: 'Array', value: 'array',
                        schema: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', title: 'id' },
                                    name: { type: 'string', title: 'name' },
                                    permissionLevel: { type: 'string', title: 'permissionLevel' }
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
