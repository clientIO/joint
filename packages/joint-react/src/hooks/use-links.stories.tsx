/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { Meta, StoryObj } from '@storybook/react';
import { SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import { useLinks } from './use-links';
import { makeRootDocs, makeStory } from 'src/stories/utils/make-story';
import { getAPILink } from 'src/stories/utils/get-api-documentation-link';
import { HookTester } from 'src/stories/utils/hook-tester';

const API_URL = getAPILink('useLinks');

export type Story = StoryObj<typeof HookTester>;

function DataRenderer({ data, name }: Readonly<{ data: unknown; name: string }>) {
  return (
    <div style={{ right: 0, display: 'inline-block', top: 0 }}>
      <h4 style={{ padding: 0, margin: 0 }}>{name}:</h4>
      <pre style={{ fontSize: 10 }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

const meta: Meta<typeof HookTester> = {
  title: 'Hooks/useLinks',
  component: HookTester,
  decorators: [SimpleGraphDecorator],
  parameters: makeRootDocs({
    apiURL: API_URL,
    description: `\`useLinks\` is a hook that returns the links of the current graph. It supports selector functions to get specific properties of the links and re-renders the component only when selected properties are changed.`,
    code: `import { useLinks } from '@joint/react'

function Component() {
  const links = useLinks();
  return <div>links are: {JSON.stringify(links)}</div>;
}`,
  }),
};

export default meta;

export const GetAllLinks: Story = makeStory<Story>({
  args: {
    useHook: useLinks,
    hookArgs: [],
    render: (result) => <DataRenderer data={result} name="All Links" />,
  },
  apiURL: API_URL,
  code: `import { useLinks } from '@joint/react'

function Component() {
  const links = useLinks();
  return <div>links are: {JSON.stringify(links)}</div>;
}`,
  description: 'Get all links.',
});

export const GetLinkIds: Story = makeStory<Story>({
  args: {
    useHook: useLinks,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hookArgs: [(links: any) => links.map((link: any) => link.id)],
    render: (result) => <DataRenderer data={result} name="Link IDs" />,
  },
  apiURL: API_URL,
  code: `import { useLinks } from '@joint/react'

function Component() {
  const linkIds = useLinks((links) => links.map(link => link.id));
  return <div>link ids are: {JSON.stringify(linkIds)}</div>;
}`,
  description: 'Get all link IDs.',
});
/* eslint-enable react-perf/jsx-no-new-object-as-prop */
