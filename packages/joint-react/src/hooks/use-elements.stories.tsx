/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import type { Meta } from '@storybook/react/*';
import { HookTester, type TesterHookStory } from '../stories/utils/hook-tester';
import { useElements } from './use-elements';
import { Paper } from '../components/paper/paper';
import { PRIMARY } from '.storybook/theme';

type Story = TesterHookStory<typeof useElements>;
const meta: Meta<typeof HookTester> = {
  title: 'Hooks/useElements',
  component: HookTester,
  decorators: [SimpleGraphDecorator],
};

export default meta;

export const Default: Story = {
  args: {
    useHook: useElements,
    hookArgs: [],
    render: (result) => (
      <span>
        All elements are: {JSON.stringify(result)}
        <Paper
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
      </span>
    ),
  },
};

export const WithSelectedJustIds: Story = {
  args: {
    useHook: useElements,
    hookArgs: [(elements) => elements.map((element) => element.id)],
    render: (result) => (
      <span>
        Element ids are: {JSON.stringify(result)}
        <Paper
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
      </span>
    ),
  },
};

export const WithGetJustSize: Story = {
  args: {
    useHook: useElements,
    hookArgs: [(elements) => elements.size],
    render: (result) => (
      <span>
        Size of elements is: {JSON.stringify(result)}
        <Paper
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
      </span>
    ),
  },
};

export const WithJustPosition: Story = {
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
      <span>
        Position is: {JSON.stringify(result)}
        <Paper
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
      </span>
    ),
  },
};

export const WithJustPositionButNotReRenderBecauseCompareFN: Story = {
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
      <span>
        Position is: {JSON.stringify(result)}
        <Paper
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
      </span>
    ),
  },
};

export const WithAdditionalData: Story = {
  args: {
    useHook: useElements,
    hookArgs: [
      (elements) =>
        elements.map((element) => ({ id: element.id, data: element.data, other: 'something' })),
    ],
    render: (result) => (
      <span>
        Element with new data are: {JSON.stringify(result)}
        <Paper
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
      </span>
    ),
  },
};
