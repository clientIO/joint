jest.mock('@andypf/json-viewer/dist/esm/react/JsonViewer', () =>
  jest.fn((properties: unknown) => JSON.stringify(properties, undefined, 2))
);
