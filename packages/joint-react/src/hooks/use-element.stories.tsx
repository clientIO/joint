import { useElement } from './use-element';
import { SimpleRenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import type { Meta } from '@storybook/react/*';
import { HookTester, type TesterHookStory } from '../stories/utils/hook-tester';
import { makeRootDocs, makeStory } from 'src/stories/utils/make-story';
import { getAPILink } from 'src/stories/utils/get-api-documentation-link';

const API_URL = getAPILink('useElement');

const meta: Meta<typeof HookTester> = {
  title: 'Hooks/useElement',
  component: HookTester,
  decorators: [SimpleRenderItemDecorator],
  parameters: makeRootDocs({
    apiURL: API_URL,
    description: `\`useElement\` is a hook that returns the element of the current cell. It is used to get the element of the current cell. It must be used inside \`renderElement\`
    It also support selector function to get specific properties of the element (it re-render the component only when selected properties are changed)
    `,
    code: `import { useElement } from '@joint/react'

function Component() {
  const element = useElement();
  return <div>element is: {element}</div>;
}`,
  }),
};

export default meta;

type Story = TesterHookStory<typeof useElement>;

export const WithId = makeStory<Story>({
  args: {
    useHook: useElement,
    hookArgs: [(element) => element.id],
  },
  apiURL: API_URL,
  code: `import { useElement } from '@joint/react'

function Component() {  
  const element = useElement();
  return <div>element id is: {element.id}</div>;
}`,
  description: 'Get the id of the element.',
});

export const WithCoordinates = makeStory<Story>({
  args: {
    useHook: useElement,
    hookArgs: [(element) => ({ x: element.x, y: element.y })],
  },
  apiURL: API_URL,
  code: `import { useElement } from '@joint/react'

function Component() {
  const element = useElement();
  return <div>element coordinates are: {element.x}, {element.y}</div>;
}`,
  description: 'Get the coordinates of the element via selector function',
});
