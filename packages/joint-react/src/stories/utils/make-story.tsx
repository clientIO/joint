/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
import type React from 'react';

// MakeStory utility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MakeStoryOptions<T extends any> {
  readonly component?: React.FC;
  readonly code?: string;
  readonly name?: string;
  readonly apiURL?: string;
  readonly description?: string;
  // @ts-expect-error we know type - its used just for story
  readonly args?: T['args'];
  // @ts-expect-error we know type - its used just for story
  readonly decorators?: T['decorators'];
  // @ts-expect-error we know type - its used just for story
  readonly play?: T['play'];
}

/**
 * Creates a story object for Storybook.
 * @param options - The options for the story.
 * @group utils
 * @internal
 * @description
 * This function is used to create a story object for Storybook.
 * @returns
 * A story object that can be used in Storybook.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeStory<T extends any>(options: MakeStoryOptions<T>): T {
  const { component, code, name, apiURL, description = '', args, decorators, play } = options;
  return {
    play,
    args,
    render: component as unknown,
    decorators,
    parameters: {
      docs: {
        description: {
          // eslint-disable-next-line sonarjs/no-nested-template-literals
          story: `${name ? `####${name}\n` : ''}[API reference](${apiURL})<br/>${description}`,
        },
        source: {
          code,
        },
      },
    },
  } as unknown as T;
}

// eslint-disable-next-line unicorn/prevent-abbreviations
interface MakeRootDocsOptions {
  readonly code?: string;
  readonly apiURL?: string;
  readonly description?: string;
}

/**
 * Creates root docs for Storybook.
 * @param options - The options for the root docs.
 * @group utils
 * @internal
 * @description
 * This function is used to create root docs for Storybook.
 * @returns
 * An object containing the docs and source code.
 */
export function makeRootDocumentation(options: MakeRootDocsOptions) {
  const { code, apiURL, description = '' } = options;

  return {
    docs: {
      description: {
        // eslint-disable-next-line sonarjs/no-nested-template-literals
        component: `${apiURL ? `[API reference](${apiURL})` : ''}<br/>${description}`,
      },
      source: {
        code,
      },
    },
  };
}
