/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { StoryObj } from '@storybook/react/*';
import type React from 'react';

// MakeStory utility
interface MakeStoryOptions<T extends StoryObj> {
  readonly component?: React.FC;
  readonly code?: string;
  readonly name?: string;
  readonly apiURL: string;
  readonly description?: string;
  readonly args?: T['args'];
  readonly decorators?: T['decorators'];
}

// @ts-expect-error
export function makeStory<T>(options: MakeStoryOptions<T>): T {
  const { component, code, name, apiURL, description = '', args, decorators } = options;
  return {
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

interface MakeRootDocsOptions {
  readonly code?: string;
  readonly apiURL: string;
  readonly description?: string;
}

export function makeRootDocs(options: MakeRootDocsOptions) {
  const { code, apiURL, description = '' } = options;

  return {
    docs: {
      description: {
        component: `[API reference](${apiURL})<br/>${description}`,
      },
      source: {
        code,
      },
    },
  };
}
