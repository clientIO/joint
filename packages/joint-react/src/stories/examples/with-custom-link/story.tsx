/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import CodeWithCreateLinks from './code-with-create-links';
import CodeWithDiaLinks from './code-with-dia-links';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';

// @ts-expect-error
import CodeWithCreateLinksCode from './code-with-create-links?raw';
// @ts-expect-error
import CodeWithDiaLinksCode from './code-with-dia-links?raw';

export type Story = StoryObj<typeof CodeWithCreateLinks>;

export default {
  title: 'Examples/With custom link',
  component: CodeWithCreateLinks,
  parameters: makeRootDocs({
    apiURL: 'https://resources.jointjs.com/tutorial/links',
    code: CodeWithCreateLinksCode,
    description: 'Code with create links.',
  }),
} satisfies Meta<typeof CodeWithCreateLinks>;

export const WithCreateLinks = makeStory({
  code: CodeWithCreateLinksCode,
  description: 'Code with create links.',
  component: CodeWithCreateLinks,
  apiURL: 'https://resources.jointjs.com/tutorial/links',
});

export const WithDiaLinks = makeStory({
  code: CodeWithDiaLinksCode,
  description: 'Code with Dia links.',
  component: CodeWithDiaLinks,
  apiURL: 'https://resources.jointjs.com/tutorial/links',
});
