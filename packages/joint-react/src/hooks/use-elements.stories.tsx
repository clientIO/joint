/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react';
import { SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import { useElements } from './use-elements';
import { Paper } from '../components/paper';

function Hook() {
  const data = useElements((elements) => elements); // Using the hook inside a component
  return (
    <>
      <span>All elements are: {data.toJSON()}</span>
      <Paper
        renderElement={({ width, height }) => {
          return <rect width={width} height={height} fill="blue" />;
        }}
      />
    </>
  );
}

export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useElements',
  component: Hook,
  decorators: [SimpleGraphDecorator],
};

export default meta;

export const Default: Story = {};
