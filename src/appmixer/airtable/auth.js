'use strict';

const crypto = require('crypto');

const airtableUrl = 'https://airtable.com';

module.exports = {

    type: 'oauth2',

    definition: () => {

        return {

            scope: ['user.email:read', 'schema.bases:read'],

            accountNameFromProfileInfo: 'email',

            authUrl: context => {

                // Taken from https://github.com/Airtable/oauth-example/blob/main/index.js
                // But we need ticket from context otherwise there's "Unknown ticket" error.
                const state = context.ticket;
                // Using context.ticket here as we need to store the code_verifier and keep it the same for the token request.
                const codeVerifier = crypto.createHash('sha256').update(context.ticket).digest('base64url');
                const codeChallengeMethod = 'S256';
                const codeChallenge = crypto
                    .createHash('sha256')
                    .update(codeVerifier) // hash the code verifier with the sha256 algorithm
                    .digest('base64') // base64 encode, needs to be transformed to base64url
                    .replace(/=/g, '') // remove =
                    .replace(/\+/g, '-') // replace + with -
                    .replace(/\//g, '_'); // replace / with _ now base64url encoded

                // ideally, entries in this cache expires after ~10-15 minutes
                // we'll use this in the redirect url route
                // any other data you want to store, like the user's ID

                // build the authorization URL
                const authorizationUrl = new URL(`${airtableUrl}/oauth2/v1/authorize`);
                authorizationUrl.searchParams.set('code_challenge', codeChallenge);
                authorizationUrl.searchParams.set('code_challenge_method', codeChallengeMethod);
                authorizationUrl.searchParams.set('state', state);
                authorizationUrl.searchParams.set('client_id', context.clientId);
                authorizationUrl.searchParams.set('redirect_uri', context.callbackUrl);
                authorizationUrl.searchParams.set('response_type', 'code');
                // your OAuth integration register with these scopes in the management page
                authorizationUrl.searchParams.set('scope', context.scope.join(' '));

                return authorizationUrl.toString();
            },

            requestAccessToken: async (context) => {

                // Using context.ticket same as in authUrl.
                const codeVerifier = crypto.createHash('sha256').update(context.ticket).digest('base64url');
                const headers = {
                    // Content-Type is always required
                    'Content-Type': 'application/x-www-form-urlencoded'
                };
                if (context.clientSecret !== '') {
                    // Authorization is required if your integration has a client secret
                    // omit it otherwise
                    const encodedCredentials = Buffer.from(`${context.clientId}:${context.clientSecret}`).toString('base64');
                    const authorizationHeader = `Basic ${encodedCredentials}`;
                    headers.Authorization = authorizationHeader;
                }

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: `${airtableUrl}/oauth2/v1/token`,
                    headers,
                    // stringify the request body like a URL query string
                    data: new URLSearchParams({
                        // client_id is optional if authorization header provided
                        // required otherwise.
                        client_id: context.clientId,
                        code_verifier: codeVerifier,
                        redirect_uri: context.callbackUrl,
                        code: context.authorizationCode,
                        grant_type: 'authorization_code'
                    })
                });
                let accessTokenExpDate = new Date();
                accessTokenExpDate.setTime(accessTokenExpDate.getTime() + (data['expires_in'] * 1000));
                let refreshTokenExpDate = new Date();
                refreshTokenExpDate
                    .setTime(refreshTokenExpDate.getTime() + (data['refresh_expires_in'] * 1000));

                const result = {
                    accessToken: data['access_token'],
                    refreshToken: data['refresh_token'],
                    accessTokenExpDate,
                    refreshTokenExpDate
                };

                return result;
            },

            requestProfileInfo: {
                method: 'GET',
                url: 'https://api.airtable.com/v0/meta/whoami',
                headers: {
                    'Authorization': 'Bearer {{accessToken}}',
                    'User-Agent': 'AppMixer'
                }
            },

            refreshAccessToken: async context => {

                const tokenUrl = `${airtableUrl}/oauth2/v1/token`;
                const headers = {
                    'Authorization':
                        'Basic ' + Buffer.from(context.clientId + ':' + context.clientSecret).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                };

                const { data } = await context.httpRequest.post(tokenUrl, {
                    grant_type: 'refresh_token',
                    refresh_token: context.refreshToken
                }, { headers });

                const newDate = new Date();
                newDate.setTime(newDate.getTime() + (data.expires_in * 1000));
                return {
                    accessToken: data.access_token,
                    accessTokenExpDate: newDate
                };
            },

            validateAccessToken: {
                method: 'GET',
                url: 'https://api.airtable.com/v0/meta/whoami',
                headers: {
                    'Authorization': 'Bearer {{accessToken}}',
                    'User-Agent': 'AppMixer'
                }
            }
        };
    }
};
