jest.mock('../stories/utils/get-api-docs-base-url', () => ({
  getApiDocsBaseUrl: jest.fn(() => 'https://www.jointjs.com/'),
}));
