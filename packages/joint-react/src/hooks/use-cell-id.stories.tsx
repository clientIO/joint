import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCellId } from './use-cell-id'; // Adjust path accordingly
import { HTMLNode, SimpleRenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import '../stories/examples/index.css';
import { getAPILink } from '../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../stories/utils/make-story';

function Hook() {
  const cellId = useCellId(); // Using the hook inside a component
  return <HTMLNode className="node">cellId is: {cellId}</HTMLNode>;
}
export type Story = StoryObj<typeof Hook>;
const API_URL = getAPILink('useCellId');
const meta: Meta<typeof Hook> = {
  title: 'Hooks/useCellId',
  component: Hook,
  decorators: [SimpleRenderItemDecorator],
  tags: ['hook'],
  parameters: makeRootDocumentation({
    description:
      '`useCellId` is a hook that returns the cellId of the current cell. It is used to get the cellId of the current cell. It must be used inside `renderElement`',
    apiURL: API_URL,
    code: `import { useCellId } from '@joint/react'
function Component() {
  const cellId = useCellId();
  return <div>cellId is: {cellId}</div>;
}`,
  }),
};

export default meta;

export const Default: Story = {};
