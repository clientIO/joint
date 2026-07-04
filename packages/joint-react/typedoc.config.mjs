import { OptionDefaults } from 'typedoc';
import { createRequire } from 'node:module';

// Markdown build config for the docs site's typedoc-to-docusaurus generator.
// Reuses the base (HTML) typedoc.json and adapts it:
// - swap the github HTML theme for typedoc-plugin-markdown
// - register a custom `@title` block tag (appended to defaults via
//   OptionDefaults, so @param/@returns/etc. keep working) — used by the docs
//   normalizer for per-signature headings
// - emit docusaurus-friendly markdown (no sources, code-block signatures,
//   table params/type-declarations)
//
// Run with: typedoc --options typedoc.config.mjs
const base = createRequire(import.meta.url)('./typedoc.json');

/** @type {Partial<import('typedoc').TypeDocOptions>} */
export default {
  ...base,
  entryPoints: ['src/index.ts'],
  out: 'docs/api-md',
  plugin: ['typedoc-plugin-markdown'],
  router: 'group',
  blockTags: [...OptionDefaults.blockTags, '@title'],
  disableSources: true,
  useCodeBlocks: true,
  parametersFormat: 'table',
  typeDeclarationFormat: 'table',
};
