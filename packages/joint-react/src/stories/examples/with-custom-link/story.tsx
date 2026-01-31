import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import CodeWithCreateLinks from './code-with-create-links';
import CodeWithDiaLinksClassName from './code-with-create-links-classname';
import CodeWithDiaLinks from './code-with-dia-links';

import CodeWithCreateLinksCode from './code-with-create-links?raw';
import CodeWithDiaLinksCode from './code-with-dia-links?raw';

import CodeWithCreateLinksClassName from './code-with-create-links-classname?raw';
import { makeRootDocumentation, makeStory } from '../../utils/make-story';

export type Story = StoryObj<typeof CodeWithCreateLinks>;

export default {
  title: 'Examples/Custom link',
  component: CodeWithCreateLinks,
  tags: ['example'],
  parameters: makeRootDocumentation({
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

export const WithCreateLinkClassName = makeStory({
  code: `${CodeWithCreateLinksClassName}\n
css:
.link {
  stroke-dasharray: 5 5; /* dash length 10, gap 10 */
  stroke-dashoffset: 0;
  animation: dashmove 1s linear infinite;
}

@keyframes dashmove {
  to {
    stroke-dashoffset: -20; /* dash + gap length */
  }
}

  `,
  description: 'Code with create links with class name.',
  component: CodeWithDiaLinksClassName,
  apiURL: 'https://resources.jointjs.com/tutorial/links',
});

export const WithDiaLinks = makeStory({
  code: CodeWithDiaLinksCode,
  description: 'Code with Dia links.',
  component: CodeWithDiaLinks,
  apiURL: 'https://resources.jointjs.com/tutorial/links',
});
