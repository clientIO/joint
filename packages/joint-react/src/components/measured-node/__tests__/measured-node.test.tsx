import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { MeasuredNode } from '../measured-node';
import * as stories from '../measured-node.stories';
runStorybookSnapshot({
  Component: MeasuredNode,
  stories,
  name: 'MeasuredNode',
  withRenderElementWrapper: true,
});
