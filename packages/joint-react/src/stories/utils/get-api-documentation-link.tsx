// eslint-disable-next-line unicorn/prevent-abbreviations
import { getApiDocsBaseUrl } from './get-api-docs-base-url';

export function getAPILink(name: string, path = 'functions') {
  return `${getApiDocsBaseUrl()}/${path}/${name}.html`;
}
export function getAPIDocumentationLink(name: string, path = 'functions') {
  const href = getAPILink(name, path);
  return <a href={href}>{name}</a>;
}

export function getAPIPropsLink(name: string, propertyName: string, path = 'interfaces') {
  const href = `${getAPILink(name, path)}#${propertyName}`;
  return <a href={href}>{propertyName}</a>;
}
