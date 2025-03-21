const BASE_DOCS_URL = 'https://github.com/clientIO/joint/tree/master/packages/joint-react/docs';

export function getAPILink(name: string, path = 'functions') {
  return `${BASE_DOCS_URL}/${path}/${name}.md`;
}
export function getAPIDocumentationLink(name: string, path = 'functions') {
  const href = getAPILink(name, path);
  return <a href={href}>{name}</a>;
}

export function getAPIPropsLink(name: string, propertyName: string, path = 'interfaces') {
  const href = `${getAPILink(name, path)}#${propertyName}`;
  return <a href={href}>{propertyName}</a>;
}
