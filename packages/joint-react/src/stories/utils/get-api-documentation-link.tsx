const STORYBOOK_BASE_DOCS_URL =
  // @ts-expect-error Vite config
  import.meta.env.STORYBOOK_BASE_DOCS_URL ?? 'https://docs.official.com';

export function getAPILink(name: string, path = 'functions') {
  return `${STORYBOOK_BASE_DOCS_URL}/${path}/${name}.html`;
}
export function getAPIDocumentationLink(name: string, path = 'functions') {
  const href = getAPILink(name, path);
  return <a href={href}>{name}</a>;
}

export function getAPIPropsLink(name: string, propertyName: string, path = 'interfaces') {
  const href = `${getAPILink(name, path)}#${propertyName}`;
  return <a href={href}>{propertyName}</a>;
}
