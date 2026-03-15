import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../stories/utils/make-story';

function Hook() {
  return null;
}

export type Story = StoryObj<typeof Hook>;
const API_URL = getAPILink('useOnNodesMeasured');

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useOnNodesMeasured',
  component: Hook,
  tags: ['hook'],
  parameters: makeRootDocumentation({
    description:
      '`useOnNodesMeasured` subscribes to the `elements:measured` paper event. ' +
      'It fires on initial measurement (all elements have `width` and `height`) and on subsequent size changes. ' +
      'The callback receives `{ isInitial, paper, graph }` to distinguish the first measurement from later ones. ' +
      'Pass `{ once: true }` to automatically unsubscribe after the first call.',
    apiURL: API_URL,
    code: `import { useOnNodesMeasured } from '@joint/react';

// Using a paper id (sibling of <Paper id={paperId}>)
const paperId = useId();
useOnNodesMeasured(paperId, ({ isInitial, paper, graph }) => {
  if (isInitial) {
    runLayout(graph);
    paper.transformToFitContent({ padding: 20 });
  }
});

// Using a paper ref
const paperRef = useRef<dia.Paper>(null);
useOnNodesMeasured(paperRef, ({ isInitial }) => {
  if (!isInitial) return;
  paperRef.current?.transformToFitContent({ padding: 20 });
});

// Fire once, then stop listening
useOnNodesMeasured(paperId, () => {
  console.log('Elements measured!');
}, [], { once: true });`,
  }),
};

export default meta;
export const Default: Story = {};
