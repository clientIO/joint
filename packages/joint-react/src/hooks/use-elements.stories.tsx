/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { DataRenderer, SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import type { Meta } from '@storybook/react/*';
import { HookTester, type TesterHookStory } from '../stories/utils/hook-tester';
import { useElements } from './use-elements';
import { Paper } from '../components/paper/paper';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { makeRootDocumentation, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';

const API_URL = getAPILink('useElements');

const meta: Meta<typeof HookTester> = {
  title: 'Hooks/useElements',
  component: HookTester,
  decorators: [SimpleGraphDecorator],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `\`useElements\` is a hook that returns the elements of the current graph. It supports selector functions to get specific properties of the elements and re-renders the component only when selected properties are changed.`,
    code: `import { useElements } from '@joint/react'

function Component() {
  const elements = useElements();
  return <div>elements are: {JSON.stringify(elements)}</div>;
}`,
  }),
};

export default meta;

type Story = TesterHookStory<typeof useElements>;

export const Default = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="All Elements" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const elements = useElements();
  return <div>elements are: {JSON.stringify(elements)}</div>;
}`,
  description: 'Get all elements.',
});

export const WithSelectedJustIds = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [(elements) => elements.map((element) => element.id)],
    render: (result) => (
      <span>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Element IDs" />
      </span>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const elementIds = useElements((elements) => elements.map((element) => element.id));
  return <div>element ids are: {JSON.stringify(elementIds)}</div>;
}`,
  description: 'Get the ids of the elements.',
});

export const WithGetJustSize = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [(elements) => elements.size],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Size of Elements" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const size = useElements((elements) => elements.size);
  return <div>size of elements is: {JSON.stringify(size)}</div>;
}`,
  description: 'Get the size of the elements.',
});

export const WithJustPosition = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [
      (elements) =>
        elements.map((element) => ({
          x: element.x,
          y: element.y,
        })),
    ],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Position" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const positions = useElements((elements) =>
    elements.map((element) => ({ x: element.x, y: element.y }))
  );
  return <div>positions are: {JSON.stringify(positions)}</div>;
}`,
  description: 'Get the positions of the elements.',
});

export const WithJustPositionButNotReRenderBecauseCompareFN = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [
      (elements) =>
        elements.map((element) => ({
          x: element.x,
          y: element.y,
        })),
      (_previous, _next) => true,
    ],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Position" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const positions = useElements(
    (elements) => elements.map((element) => ({ x: element.x, y: element.y })),
    (_previous, _next) => true
  );
  return <div>positions are: {JSON.stringify(positions)}</div>;
}`,
  description:
    'Get the positions of the elements but do not re-render because of custom compare function.',
});

export const WithAdditionalData = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [
      (elements) =>
        elements.map((element) => ({ id: element.id, data: element.data, other: 'something' })),
    ],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Element with new data" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const elements = useElements((elements) =>
    elements.map((element) => ({ id: element.id, data: element.data, other: 'something' }))
  );
  return <div>elements with new data are: {JSON.stringify(elements)}</div>;
}`,
  description: 'Get the elements with additional data.',
});
