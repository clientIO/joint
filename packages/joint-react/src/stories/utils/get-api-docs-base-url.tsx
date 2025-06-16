// eslint-disable-next-line unicorn/prevent-abbreviations
export function getApiDocsBaseUrl(): string {
  // @ts-expect-error vite env is not typed
  return import.meta.env.STORYBOOK_BASE_DOCS_URL ?? 'https://docs.official.com';
}
