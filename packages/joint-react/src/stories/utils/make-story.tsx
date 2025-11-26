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
  readonly details?: string;
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
  const {
    component,
    code,
    name,
    apiURL,
    description = '',
    details,
    args,
    decorators,
    play,
  } = options;

  let storyDescription = '';

  if (name) {
    storyDescription += `#### ${name}\n\n`;
  }

  if (apiURL) {
    storyDescription += `[📚 API reference](${apiURL})\n\n`;
  }

  if (description) {
    storyDescription += `${description}\n\n`;
  }

  if (details) {
    storyDescription += `${details}`;
  }

  return {
    play,
    args,
    render: component as unknown,
    decorators,
    parameters: {
      docs: {
        description: {
          story: storyDescription,
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
  readonly usage?: string;
  readonly props?: string;
  readonly examples?: string;
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
  const { code, apiURL, description = '', usage, props, examples } = options;

  let componentDescription = '';

  if (apiURL) {
    componentDescription += `[📚 API reference](${apiURL})<br/><br/>`;
  }

  if (description) {
    componentDescription += `${description}<br/><br/>`;
  }

  if (usage) {
    componentDescription += `### Usage\n\n${usage}<br/><br/>`;
  }

  if (props) {
    componentDescription += `### Props\n\n${props}<br/><br/>`;
  }

  if (examples) {
    componentDescription += `### Examples\n\n${examples}`;
  }

  return {
    docs: {
      description: {
        component: componentDescription,
      },
      source: {
        code,
      },
    },
  };
}
