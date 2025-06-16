jest.mock('@andypf/json-viewer/dist/esm/react/JsonViewer', () =>
  jest.fn((properties: unknown) => JSON.stringify(properties, undefined, 2))
);

jest.mock('../src/stories/utils/get-api-docs-base-url', () => ({
  getApiDocsBaseUrl: jest.fn(() => 'https://www.jointjs.com/'),
}));
