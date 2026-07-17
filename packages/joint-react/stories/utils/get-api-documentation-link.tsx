// eslint-disable-next-line unicorn/prevent-abbreviations
import { getApiDocsBaseUrl } from './get-api-docs-base-url';

/** TypeDoc `group` categories exposed at docs.jointjs.com/api-react. */
export type ApiCategory =
  | 'Components'
  | 'Hooks'
  | 'Utils'
  | 'Variables'
  | 'Types'
  | 'Selectors'
  | 'MVC'
  | 'Presets';

function inferCategory(name: string): ApiCategory {
  if (name.startsWith('use')) return 'Hooks';
  if (name.startsWith('select')) return 'Selectors';
  // Lower-case leading char that isn't a hook/selector → a utility function.
  if (name[0] === name[0]?.toLowerCase()) return 'Utils';
  return 'Components';
}

/**
 * Builds a link to the generated API reference, e.g.
 * `https://docs.jointjs.com/api-react/Hooks/useGraph`.
 * @param name - The exported symbol name.
 * @param category - TypeDoc group. Inferred from the name when omitted.
 */
export function getAPILink(name: string, category?: ApiCategory): string {
  return `${getApiDocsBaseUrl()}/${category ?? inferCategory(name)}/${name}`;
}
